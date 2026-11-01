# Legion naming audit

## Product naming

The current README, desktop launcher and interface identify the product as
FlagHop. Upstream Legion attribution and GPL notices must remain.

## Remaining names and recommended treatment

| Location / name | Meaning | Treatment |
| --- | --- | --- |
| `/home/joshua/Projects/legion` | Capped mounted filesystem, not an ordinary directory | Rename requires administrator access and coordinated fstab/mount/service/worktree changes. Current session cannot authenticate sudo. `flaghop` is currently a compatibility symlink to this mount, not a completed physical rename. |
| `legion.py`, `startLegion.sh` | Existing program entrypoints | Retained for compatibility. `flaghop.py` now provides the product-named entrypoint used in README instructions. |
| `legion.service`, `legion-desktop.service`, `legion-storage-guard.service` | Installed user services | Rename alongside launch scripts and mount migration; avoid a second backend or guard. |
| `LEGION_HOME`, `get_legion_home`, `legion.conf`, `.legion` | Existing settings and project format | Keep compatible with saved projects and installed readers; renaming is a migration, not cosmetic text replacement. |
| `LegionWindow`, Qt profile `Legion`, local socket prefix | Internal class/profile/process identities | Class naming is cosmetic; profile/socket changes require lifecycle and stored-state compatibility. |
| `legion.js`, `legion.css`, CSS classes, JS globals | Existing frontend integration names | Rename together with all consumers if desired; current names do not independently label the visible product. |
| Original Legion logos/screenshots and editable artwork | Inherited assets | Review usage before removal; preserve copyright/attribution. |
| `legion-device-icons-v1` | Original illustration package | Candidate for a FlagHop package name; references/manifests must be updated together. |
| Upstream repository URLs and attribution | Origin/licence | Retain Legion. |

## Repository and source consolidation

Remote branches were already ancestors of origin/main. Local documentation,
independently accepted capabilities and the collected source/assets were merged
into local main. Incoming Markdown was placed under temporary-documents.
The imported hackathons subtree is approximately 37 MB on disk; it is a source
and design bundle, not a replacement for installed tool runtimes or raw outputs.

The original Hackathons workspace contains the cipher/hash watchers, scanner,
filesystem integration, shared reader, Pi bridge, acceptance harnesses, artwork,
tools, generated browser/scan validation output and a scanner backup. Its large
runtime/evidence folders remain external and are not silently deleted by import.
