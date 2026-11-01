import unittest
from run_evaluation import assess

class OracleTests(unittest.TestCase):
 def ev(self):return {'targets':[],'findings':[],'attempts':[],'sources':[],'nodes':[],'reachable':set(),'events':[],'cipher_reports':[]}
 def case(self,goal):return {'goal':goal,'expected_hex':b'expected'.hex(),'format':'md5'}
 def test_unknown_public_sample_is_never_scored_as_correct(self):self.assertEqual(assess(self.case('observe'),self.ev(),True)[0],'observation')
 def test_no_result_before_budget_is_inconclusive(self):self.assertEqual(assess(self.case('plaintext'),self.ev(),False)[0],'inconclusive')
 def test_incomplete_quiet_case_cannot_pass(self):self.assertEqual(assess(self.case('quiet'),self.ev(),False)[0],'inconclusive')
 def test_unprocessed_negative_cannot_pass(self):
  ev=self.ev();ev['events']=[{'kind':'node_error'}]
  self.assertEqual(assess(self.case('quiet'),ev,True)[0],'inconclusive')
 def test_wrong_password_does_not_count(self):
  ev=self.ev();ev['targets']=[{'status':'recovered','format':'md5','recovered_hex':b'wrong'.hex()}]
  self.assertEqual(assess(self.case('password'),ev,True)[0],'miss')
 def test_wrong_format_does_not_count(self):
  ev=self.ev();ev['targets']=[{'status':'recovered','format':'pdf','recovered_hex':b'expected'.hex()}]
  self.assertEqual(assess(self.case('password'),ev,True)[0],'miss')
if __name__=='__main__':unittest.main()
