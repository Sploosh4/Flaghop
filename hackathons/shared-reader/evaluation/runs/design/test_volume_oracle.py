import unittest
from run_volume import assess

class VolumeOracleTests(unittest.TestCase):
 def ev(self):return {'targets':[],'findings':[],'attempts':[],'sources':[],'nodes':[],'reachable':set(),'events':[],'cipher_reports':[],'hash_reports':[]}
 def case(self):return {'goal':'quiet','expected_hex':'','format':None}
 def test_candidate_limited_scan_cannot_clear_negative_file(self):
  ev=self.ev();ev['cipher_reports']=[('node',{'status':'partial'})]
  self.assertEqual(assess(self.case(),ev,True)[0],'inconclusive')
 def test_failed_hash_scan_cannot_clear_negative_file(self):
  ev=self.ev();ev['hash_reports']=[('node',{'status':'error'})]
  self.assertEqual(assess(self.case(),ev,True)[0],'inconclusive')
if __name__=='__main__':unittest.main()
