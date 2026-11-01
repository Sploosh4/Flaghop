import hashlib,json,zipfile
from pathlib import Path
from PIL import Image
root=Path('.')
files=['active-directory.png','cloud-identity.png','web-application.png','software-application.png']
refs=['computer.png','server.png','vpn-appliance.png']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
checks={'assets':{},'references':{}}
for name in files:
 p=root/name
 im=Image.open(p)
 a=im.getchannel('A')
 checks['assets'][name]={'sha256':sha(p),'size':im.size,'mode':im.mode,'alpha_extrema':a.getextrema(),'transparent_pixels':a.histogram()[0]}
for name in refs:
 p=root/'references'/name
 original=Path('/home/joshua/Projects/legion/app/web/static/images/hardware')/name
 checks['references'][name]={'sha256':sha(p),'matches_original':sha(p)==sha(original)}
(root/'checks.json').write_text(json.dumps(checks,indent=2)+'\n')
(root/'generation-manifest.json').write_text(json.dumps({'tool':'built-in image_gen','status':'unapproved concepts, not integrated','style_references':['references/'+x for x in refs],'prompts':'prompts.json','note':'First two entries retain the revised prompts returned in the original generation record; last two retain the exact submitted prompts.'},indent=2)+'\n')
assert all(x['transparent_pixels']>0 and x['alpha_extrema']==(0,255) for x in checks['assets'].values())
assert all(x['matches_original'] for x in checks['references'].values())
paths=[*files,*['references/'+x for x in refs],'review.html','review.png','README.txt','prompts.json','generation-manifest.json','checks.json','review-browser-checks.json']
with zipfile.ZipFile('../flaghop-map-extension-v1.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in paths:z.write(p,p)
with zipfile.ZipFile('../flaghop-map-extension-v1.zip') as z:
 assert z.testzip() is None
 print('ZIP CRC OK',len(z.namelist()),'files')
print(json.dumps(checks,indent=2))
