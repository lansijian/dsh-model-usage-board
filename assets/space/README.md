# Space textures and 3D renders

The scene uses rendered 3D sprites and one public-domain deep-sky plate.
Everything is bundled; the board never fetches an image from a third-party
site at runtime.

| File | Source | Credit / license |
| --- | --- | --- |
| `sun3d.webp` | Blender procedural solar sphere (granulation, limb darkening) | Original render |
| `moon3d.webp` | Blender 3D sphere using the [NASA/JPL/USGS PIA00405](https://photojournal.jpl.nasa.gov/catalog/PIA00405) lunar texture | NASA/JPL/USGS texture, public domain; render original |
| `cloud3d.webp`, `cloud3d-far.webp` | Blender metaball cloud banks with warm/cool key lighting | Original renders |
| `galaxy.webp` | [NASA/JPL-Caltech/ESA/CXC/STScI PIA12348](https://commons.wikimedia.org/wiki/File:Center_of_the_Milky_Way_Galaxy_IV_%E2%80%93_Composite.jpg) | NASA/JPL-Caltech/ESA/CXC/STScI, public domain |
| `grain.webp` | Generated film grain | Original work |

The Sun and Moon are no longer flat cutouts. `sun3d.webp` is a shaded
procedural sphere with a feathered limb; `moon3d.webp` is a lit sphere with a
camera-projected lunar texture and bump, so the terminator and crater relief
are visible. Cloud sprites are 3D renders with independently moving layers in
the board; they are tinted per phase in CSS, not re-rendered five times.

The Milky Way remains a real deep-sky plate because a rendered approximation
lost the dust lanes and star density; it is radially masked and drifts behind
the other layers.
