"""Fetch inert upstream test files, pinned by commit. Never execute their content."""
import hashlib,json,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent
SOURCES=[
 ('python/cpython','3fb88e94db547e9dbed97de68da87bcf9335a53a','LICENSE',['Lib/test/archivetestdata/README.md','Lib/test/archivetestdata/zipdir.zip','Lib/test/archivetestdata/zipdir_backslash.zip','Lib/test/archivetestdata/zip_cp437_header.zip','Lib/test/archivetestdata/testtar.tar.xz','Lib/test/archivetestdata/recursion.tar','Lib/test/json_tests/pass1.json']),
 ('python-pillow/Pillow','bb6181dd1e6c284771c98058f2e7c0c79673ef22','LICENSE',['Tests/images/hopper.png','Tests/images/hopper.jpg','Tests/images/hopper.gif','Tests/images/16bit.s.tif','Tests/images/DXGI_FORMAT_BC7_UNORM_SRGB.dds']),
 ('qpdf/qpdf','4eba95899886e851cc41d76886483b347612f2a8','LICENSE.txt',['qpdf/qtest/qpdf/11-pages.pdf','qpdf/qtest/qpdf/add-attachments-1.pdf','qpdf/qtest/qpdf/V4-aes.pdf','qpdf/qtest/qpdf/V4.pdf'])]

def main():
 out=ROOT/'public-samples';out.mkdir(exist_ok=True)
 entries=[]
 for repo,commit,license_name,paths in SOURCES:
  for path in paths+[license_name]:
   url=f'https://raw.githubusercontent.com/{repo}/{commit}/{path}'
   name=repo.replace('/','-')+'__'+path.replace('/','__')
   try:
    req=urllib.request.Request(url,headers={'User-Agent':'Offline-reader-file-evaluation'})
    with urllib.request.urlopen(req,timeout=30) as handle:
     data=handle.read(2_000_001)
    if len(data)>2_000_000:raise ValueError('Sample exceeds 2 MB download cap')
    destination=out/name;destination.write_bytes(data)
    entries.append({'repo':repo,'commit':commit,'path':path,'url':url,'license':path==license_name,'local':str(destination),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
   except Exception as error:entries.append({'repo':repo,'commit':commit,'path':path,'url':url,'error':str(error),'license':path==license_name})
 (ROOT/'public-manifest.json').write_text(json.dumps(entries,indent=2)+'\n')
 print(json.dumps({'downloaded':sum('sha256'in x and not x['license'] for x in entries),'failed':[x['path'] for x in entries if 'error'in x]}))
if __name__=='__main__':main()
