import unittest
from io import StringIO
import legion


class LegionLauncherTest(unittest.TestCase):

    def test_tool_audit_flag_parses(self):
        args = legion.build_arg_parser().parse_args(["--tool-audit"])
        self.assertTrue(args.tool_audit)
        self.assertIsNone(args.tool_install_plan)
        self.assertIsNone(args.tool_install)

    def test_tool_install_plan_flag_parses(self):
        args = legion.build_arg_parser().parse_args(["--tool-install-plan", "ubuntu"])
        self.assertEqual("ubuntu", args.tool_install_plan)
        self.assertIsNone(args.tool_install)

    def test_tool_install_flag_parses(self):
        args = legion.build_arg_parser().parse_args(["--tool-install", "kali"])
        self.assertEqual("kali", args.tool_install)
        self.assertIsNone(args.tool_install_plan)

    def test_web_bind_all_flag_defaults_to_localhost(self):
        args = legion.build_arg_parser().parse_args(["--web"])
        self.assertFalse(args.web_bind_all)
        self.assertEqual("127.0.0.1", legion.resolve_web_bind_host(args))
        self.assertEqual("Localhost only", legion.describe_web_bind_host("127.0.0.1"))

    def test_web_bind_all_flag_uses_all_interfaces(self):
        args = legion.build_arg_parser().parse_args(["--web", "--web-bind-all", "--web-port", "5050"])
        self.assertTrue(args.web_bind_all)
        self.assertEqual(5050, args.web_port)
        self.assertEqual("0.0.0.0", legion.resolve_web_bind_host(args))
        self.assertEqual("All interfaces", legion.describe_web_bind_host("0.0.0.0"))

    def test_web_opaque_ui_defaults_enabled(self):
        args = legion.build_arg_parser().parse_args(["--web"])
        self.assertFalse(args.web_transparent_ui)
        self.assertTrue(legion.resolve_web_opaque_ui(args))

    def test_web_transparent_ui_flag_disables_opaque_mode(self):
        args = legion.build_arg_parser().parse_args(["--web", "--web-transparent-ui"])
        self.assertTrue(args.web_transparent_ui)
        self.assertFalse(legion.resolve_web_opaque_ui(args))

    def test_supported_python_runtime_accepts_python_312(self):
        self.assertTrue(legion.is_supported_python_runtime((3, 12, 0)))
        self.assertTrue(legion.is_supported_python_runtime((3, 13, 1)))

    def test_supported_python_runtime_rejects_python_310(self):
        self.assertFalse(legion.is_supported_python_runtime((3, 10, 12)))

    def test_format_python_runtime_error_mentions_current_interpreter(self):
        message = legion.format_python_runtime_error(
            version_info=(3, 10, 12),
            executable="/usr/bin/python3.10",
            prefix="/usr",
            base_prefix="/usr",
        )
        self.assertIn("Python 3.12+", message)
        self.assertIn("/usr/bin/python3.10", message)
        self.assertIn("3.10.12", message)
        self.assertIn("python3.12 -m venv .venv", message)

    def test_ensure_supported_python_runtime_exits_on_old_python(self):
        stderr = StringIO()
        with self.assertRaises(SystemExit) as ctx:
            legion.ensure_supported_python_runtime(
                version_info=(3, 10, 12),
                executable="/usr/bin/python3.10",
                prefix="/usr",
                base_prefix="/usr",
                stderr=stderr,
            )
        self.assertEqual(1, ctx.exception.code)
        self.assertIn("Python 3.12+", stderr.getvalue())
