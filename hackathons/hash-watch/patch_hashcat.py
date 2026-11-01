"""Add an opt-in include path for the private GPU OpenCL header installation."""
from pathlib import Path
root=Path(__file__).resolve().parent
p=root/'.tools/hashcat/src/backend.c'
s=p.read_text()
needle='int build_options_len = snprintf(build_options_buf, build_options_sz, "-D KERNEL_STATIC ");'
addition='''

    // Hash Watch: private, opt-in OpenCL headers for the relocated Mesa runtime.
    const char *hw_headers = getenv ("HASH_WATCH_OPENCL_HEADERS");
    if (hw_headers && (device_param->opencl_device_type & CL_DEVICE_TYPE_GPU))
    {
      build_options_len += snprintf (build_options_buf + build_options_len, build_options_sz - build_options_len, "-I \\"%s\\" ", hw_headers);
    }'''
if 'Hash Watch: private' not in s:
 assert s.count(needle)==1
 p.write_text(s.replace(needle,needle+addition))
print('Hashcat source uses opt-in private GPU header path; stock behavior retained without env variable.')
