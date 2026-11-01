FlagHop map artwork - review concepts v1
=======================================

Four proposed logical-target illustrations, generated using the built-in
image_gen tool by a subagent at Joshua's request. These concepts have not been
approved or integrated into FlagHop. They do not create categories, subcategories
or executable capabilities.

active-directory.png   Directory/identity-system concept for Active Directory
cloud-identity.png     Cloud identity concept for Entra ID / IAM
web-application.png    Website / web application concept
software-application.png  Installed software application concept

These are generic illustrations, not official product logos. The UI must label
the actual observed system. An image alone establishes no product identity,
version, hosting relationship, connection or vulnerability.

Style reference
---------------
references/ contains unchanged copies of the approved computer, server and VPN
appliance illustrations currently used by FlagHop. Their source paths and hashes
are recorded in checks.json. New images reference their materials, perspective,
lighting and restrained lavender accents. The PNGs retain their generated alpha;
review.html supplies a dark backdrop for inspection.

Open review.html to compare the new concepts with approved reference artwork.
review.png is a browser-rendered preview, not a replacement for the PNG assets.
prompts.json and generation-manifest.json preserve generation provenance.

Design discussion only
----------------------
- Network membership can use labelled rectangles drawn by the UI. Overlapping
  networks and multi-interface devices need a representation we still must agree.
- Keep hostname, IP address and OS name beneath each device. Do not include the
  OS version in that label. Unknown values must remain unknown.
- Try Ubuntu / Ubuntu Server and Windows / Windows Server as text labels or
  small badges on existing hardware pictures before making separate device art.
- Expand relevant applications/services around a selected device rather than
  showing every installed application or binary in the opening map.
- Distinguish evidence of hosting from a connection observed through a computer;
  one does not establish the other. Grey-line meaning is still under discussion.
- The user has not yet completed their third point about grey connecting lines.

No source images were overwritten and no application behaviour was changed.
