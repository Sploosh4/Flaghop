"""Check the harness's accounting so a manual workaround cannot hide a gap."""
from pathlib import Path
import base64
import hashlib
import random
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from audit import Case, corpus, evaluate, evidence_issues, digest
from audit import ROOT
from cipher_watch.extract_bridge import extract
from hash_watch.detect import identify

class AuditTests(unittest.TestCase):
    def test_unique_case_ids(self):
        cases=corpus()
        self.assertEqual(len(cases),len({c.name for c in cases}))
        self.assertEqual({c.phase for c in cases},{'contract','extension','tandem'})

    def test_manual_bridge_never_counts_as_automatic_recovery(self):
        case=Case('probe','tandem','tandem',b'', 'recovered',b'password')
        observation={'hash':{'targets':[]},'manual_bridge_controls':[{'expected_recovered':True}]}
        self.assertFalse(evaluate(case,observation))

    def test_wrong_recovered_password_fails_known_answer(self):
        case=Case('probe','contract','hash',b'', 'recovered',b'password')
        self.assertFalse(evaluate(case,{'hash':{'targets':[{'status':'recovered','recovered_hex':b'wrong'.hex()}]}}))

    def test_empty_recovery_is_a_valid_known_answer(self):
        case=Case('probe','extension','native',b'', 'recovered',b'')
        self.assertTrue(evaluate(case,{'native':{'status':'recovered','plaintext_hex':''}}))

    def test_no_targets_does_not_count_as_ambiguous_detection(self):
        case=Case('probe','contract','hash',b'', 'needs_format')
        self.assertFalse(evaluate(case,{'hash':{'targets':[]}}))

    def test_complete_scan_does_not_count_as_decode(self):
        case=Case('probe','contract','cipher',b'', 'decoded',b'hello')
        self.assertFalse(evaluate(case,{'cipher':{'status':'complete','findings':[]}}))

    def test_source_hash_mismatch_is_reported(self):
        report={'source':{'sha256':'wrong'},'candidates':[],'findings':[]}
        self.assertIn('cipher source SHA-256 mismatch',evidence_issues(b'original',{'cipher':report}))

    def test_incorrect_candidate_location_is_reported(self):
        report={'source':{'sha256':digest(b'abc')},'candidates':[
            {'offset':0,'length':3,'encoded_b64':'eHl6','line':1,'byte_column':1}], 'findings':[]}
        self.assertIn('cipher encoded source span mismatch',evidence_issues(b'abc',{'cipher':report}))

    def test_line_numbers_are_checked_as_bytes(self):
        data='é\nabc'.encode()
        report={'source':{'sha256':digest(data)},'candidates':[
            {'offset':3,'length':3,'encoded_b64':'YWJj','line':2,'byte_column':1}], 'findings':[]}
        self.assertEqual(evidence_issues(data,{'cipher':report}),[])


class ExtractorPropertyTests(unittest.TestCase):
    def test_seeded_binary_base64_payloads_preserve_all_three_locations(self):
        rng=random.Random(20261031)
        for iteration in range(32):
            payload=rng.randbytes(rng.randrange(16,80))
            encoded=base64.b64encode(payload)
            data=b'\xff\n"'+encoded+b'"\n\xff"'+encoded+b'"\n"'+encoded+b'"'
            with self.subTest(iteration=iteration):
                result=extract(ROOT/'cipher-watch/.tools/base64dump.py',data,['b64'],8,1024,64)
                matches=[c for c in result['candidates'] if base64.b64decode(c['decoded_b64'])==payload]
                self.assertEqual(len(matches),3)
                expected=[]
                start=0
                while (offset:=data.find(encoded,start))>=0:
                    expected.append(offset);start=offset+len(encoded)
                self.assertEqual([c['offset'] for c in matches],expected)
                self.assertEqual(result['warnings'],[])

    def test_hash_labels_quotes_and_whitespace_keep_values_and_locations(self):
        for fmt in ('md5','sha1','sha256','sha512'):
            value=hashlib.new(fmt,b'audit-known-password').hexdigest().encode()
            for label in (fmt,fmt.upper(),fmt+'_hash'):
                for separator in (b' = "',b"': '",b':\n\t"'):
                    data='é🙂\n'.encode()+label.encode()+separator+value+b'"'
                    with self.subTest(format=fmt,label=label,separator=separator):
                        candidates,warnings=identify(data)
                        self.assertEqual(len(candidates),1)
                        self.assertEqual(candidates[0]['value'],value.decode())
                        self.assertEqual(candidates[0]['format'],fmt)
                        self.assertEqual(candidates[0]['location']['offset'],data.index(value))
                        self.assertEqual(warnings,[])

    def test_hash_widths_do_not_match_substrings_of_longer_tokens(self):
        for width in (32,40,64,128):
            for data in (b'g'+b'a'*width,b'a'*width+b'g',b'a'*(width+1)):
                with self.subTest(width=width,data=data):
                    self.assertEqual(identify(data)[0],[])

if __name__=='__main__':
    unittest.main()
