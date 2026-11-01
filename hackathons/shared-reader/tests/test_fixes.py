"""Regressions for measured offline files; no challenge services or targets."""
import base64,bz2,codecs,hashlib,json,lzma,tempfile,time,unittest,sys
from pathlib import Path
from unittest.mock import patch
from shared_reader import ROOT
from cipher_watch.tool_paths import tool_path
from shared_reader.transforms import layers
from shared_reader.project import Project
from cipher_watch.extract_bridge import extract
from cipher_watch.adapters import parse_ciphey
from cipher_watch.scanner import Scanner,Settings
from hash_watch.detect import identify
from hash_watch.engines import crack_batch
sys.path.insert(0,str(ROOT/'shared-reader/evaluation'))
from build_corpus import png,pdf
MESSAGE=b'The spare key is under the blue flower pot.'
RECORD=b'md5="'+hashlib.md5(b'password').hexdigest().encode()+b'"'

class FixTests(unittest.TestCase):
 def test_duplicate_locations_do_not_hide_footer_in_either_extractor(self):
  data=b'service="ControllerAlphaBetaGamma" route="workspaceStatusPanel"\n'*30000+b'fixture="'+base64.b64encode(RECORD)+b'"\n'
  raw=extract(tool_path('base64dump.py'),data,['b64'],8,16384,64)
  self.assertIn(RECORD,[base64.b64decode(c['decoded_b64']) for c in raw['candidates']])
  self.assertNotIn('candidate_count_limit',raw['warnings']);self.assertLess(len(raw['candidates']),64)
  self.assertTrue(any(n['occurrences']>64 for n in raw['notes']))
  result=list(layers(data,maximum=2_000_000));self.assertIn(RECORD,[c for c,_,_ in result])
  self.assertFalse(any(k=='normalization_candidate_limit' for _,k,_ in result))
 def test_real_distinct_candidate_limit_remains_visible(self):
  data=b'\n'.join(b'"'+base64.b64encode(f'known unique payload {i:03}'.encode())+b'"' for i in range(65))
  raw=extract(tool_path('base64dump.py'),data,['b64'],8,16384,64)
  self.assertEqual(raw['unique_values'],64);self.assertEqual(raw['omitted_unique_values'],1)
  self.assertIn('candidate_count_limit',raw['warnings'])
 def test_control_byte_plaintext_is_rejected(self):
  for text in ('\x00\x01','\x7f','\u0081'):
   self.assertEqual(parse_ciphey({'status':'complete','stdout':'The plaintext is:\n'+text+'\nthe decoder used is Reverse\n','stderr':''})['status'],'rejected_candidate')
 def test_language_budget_does_not_discard_extracted_hash_bytes(self):
  with tempfile.TemporaryDirectory() as t:
   root=Path(t);inbox=root/'input';inbox.mkdir();source=inbox/'file'
   values=[b'first useful passage',b'second useful passage',b'third useful passage',RECORD]
   source.write_bytes(b'\n'.join(b'"'+base64.b64encode(v)+b'"' for v in values))
   scanner=Scanner(inbox,root/'out',tool_path('base64dump.py'),tool_path('ciphey'),Settings(file_seconds=2,encodings='b64'))
   def slow(*args,**kw):
    time.sleep(.7);return {'status':'not_found'},{'status':'complete','returncode':0,'stdout':'','stderr':'','elapsed_seconds':.7}
   try:
    with patch('cipher_watch.scanner.decode',slow):report=json.loads(scanner.scan(source).read_text())
    self.assertEqual(len(report['candidates']),len(values))
    self.assertIn(RECORD,[base64.b64decode(c['decoded_b64']) for c in report['candidates']])
    self.assertIn('not_attempted',[c['status'] for c in report['candidates']])
   finally:scanner.close()
 def test_new_encoding_and_compressed_metadata_layers(self):
  encoded=base64.b64encode(MESSAGE)
  cases=[(base64.b32encode(MESSAGE),MESSAGE),(base64.b85encode(MESSAGE),MESSAGE),(base64.a85encode(MESSAGE),MESSAGE),(bz2.compress(encoded),encoded),(lzma.compress(encoded),encoded),(png(encoded,True),encoded),(pdf(encoded,True),encoded),(b''.join(b'%%%02X'%n for n in MESSAGE),MESSAGE),(b''.join(b'\\u%04x'%n for n in MESSAGE),MESSAGE),(b'const note="'+encoded[:16]+b'" + "'+encoded[16:]+b'";',encoded)]
  for data,expected in cases:
   with self.subTest(data=data[:25]):self.assertIn(expected,[c for c,_,_ in layers(data,maximum=2_000_000)])
 def test_classical_passages_are_explicitly_unverified_hypotheses(self):
  for data in (codecs.encode(MESSAGE.decode(),'rot13').encode(),MESSAGE[::-1]):
   result=list(layers(data,maximum=2_000_000));self.assertIn(MESSAGE,[c for c,_,_ in result])
   self.assertTrue(all(m.get('human_verified') is False for _,k,m in result if k.startswith('hypothesis:')))
 def test_classical_hypotheses_do_not_invent_reversed_raw_hashes(self):
  value=hashlib.md5(b'password').hexdigest().encode()
  self.assertFalse(any(k.startswith('hypothesis:') for _,k,_ in layers(value,maximum=2_000_000)))
 def test_compressed_expansion_is_bounded(self):
  for data in (bz2.compress(b'x'*10000),lzma.compress(b'x'*10000),png(b'x'*10000,True),pdf(b'x'*10000,True)):
   result=list(layers(data,maximum=100));self.assertFalse(any(c is not None and len(c)>100 for c,_,_ in result));self.assertTrue(any(c is None for c,_,_ in result))
 def test_log_and_embedded_json_checksums_do_not_auto_queue(self):
  digest=hashlib.md5(b'password').hexdigest().encode()
  for data in (b'checksum: md5="'+digest+b'"',b'log entry {"checksum":{"md5":"'+digest+b'"}}',b'md5="'+digest+b'" # checksum'):
   candidates,_=identify(data);self.assertEqual(len(candidates),1);self.assertIsNone(candidates[0]['format'])
 def test_algorithm_sibling_and_pwdump_context(self):
  value=hashlib.md5(b'password').hexdigest().encode()
  self.assertEqual(identify(b'{"algorithm":"md5","hash":"'+value+b'"}')[0][0]['format'],'md5')
  nt=b'8846f7eaee8fb117ad06bdd830b7586c'
  candidates,_=identify(b'user:1000:aad3b435b51404eeaad3b435b51404ee:'+nt+b':::')
  self.assertEqual(next(c for c in candidates if c['value']==nt.decode())['format'],'ntlm')
 def test_sha224_sha384_real_native_recovery_with_independent_verification(self):
  with tempfile.TemporaryDirectory() as temporary:
   for fmt in ('sha224','sha384'):
    value=hashlib.new(fmt,b'password').hexdigest();self.assertEqual(identify((fmt+'="'+value+'"').encode())[0][0]['format'],fmt)
    for engine in ('john','hashcat'):
     result=crack_batch(Path(temporary)/(fmt+'-'+engine),target=value,format_id=fmt,words=[b'wrong',b'password'],engine=engine,seconds=10,threads=4)
     self.assertEqual(result['status'],'recovered',result);self.assertEqual(result['plaintext_hex'],b'password'.hex());self.assertEqual(result['verification'],'independent hash check')
 def test_failed_hash_helper_marks_combined_parent_partial(self):
  with tempfile.TemporaryDirectory() as temporary:
   root=Path(temporary);project=root/'project';inputs=project/'input';inputs.mkdir(parents=True)
   seeds=root/'seeds';seeds.write_bytes(b'audit\n')
   source=inputs/'broken-key';source.write_bytes(b'-----BEGIN OPENSSH PRIVATE KEY-----\nnot-a-key\n-----END OPENSSH PRIVATE KEY-----')
   reader=Project(project,wordlist=seeds)
   try:
    reader.ingest(source);reader.process_one()
    parent=reader.db.execute('SELECT * FROM nodes WHERE id=?',(hashlib.sha256(source.read_bytes()).hexdigest(),)).fetchone()
    self.assertEqual(parent['status'],'partial')
    self.assertTrue(reader.db.execute("SELECT 1 FROM events WHERE kind='hash_reader_incomplete'").fetchone())
   finally:reader.close()
if __name__=='__main__':unittest.main()
