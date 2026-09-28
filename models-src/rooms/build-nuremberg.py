"""Add the approved apartment as a separate scene in rooms.blend.
Usage: Blender --background --factory-startup --python build-nuremberg.py
Existing scenes and meshes are preserved; an original-file backup is made.
Refuses to overwrite an existing generated scene. All dimensions are approximate.
"""
import bpy,json,math,hashlib,shutil,datetime
from pathlib import Path
from mathutils import Vector
from mathutils.geometry import tessellate_polygon
ROOT=Path(__file__).resolve().parent
PROJECT=ROOT.parent.parent
PLAN=PROJECT/'output/flat-plan/revision-03'
FILE=ROOT/'rooms.blend'
D=json.loads((ROOT/'nuremberg-layout.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(FILE))
SCENE_NAME='Nuremberg Apartment'
if SCENE_NAME in bpy.data.scenes:raise RuntimeError('Generated scene already exists; review it before rebuilding.')

# Fingerprint all existing geometry and transforms for a post-save preservation check.
def fingerprint(o):
 h=hashlib.sha256();h.update(o.name.encode());h.update(o.type.encode());h.update(str([list(row) for row in o.matrix_world]).encode())
 if o.type=='MESH':
  h.update(str([list(v.co) for v in o.data.vertices]).encode());h.update(str([list(p.vertices) for p in o.data.polygons]).encode());h.update(str([m.name if m else None for m in o.data.materials]).encode())
 return h.hexdigest()
bpy.context.view_layer.update()
existing={o.name:fingerprint(o) for o in bpy.data.objects}
original_scenes={s.name:{'objects':sorted(o.name for o in s.objects),'units':s.unit_settings.system,'scale':s.unit_settings.scale_length,'camera':s.camera.name if s.camera else None} for s in bpy.data.scenes}
backup_dir=ROOT/'backups';backup_dir.mkdir(exist_ok=True)
backup=backup_dir/('rooms-before-nuremberg-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S')+'.blend')
shutil.copy2(FILE,backup)
scene=bpy.data.scenes.new(SCENE_NAME);scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1.0
bpy.context.window.scene=scene
scene['generated_apartment']=True;scene['wall_height_m']=1.3;scene['source']='Approved plan, revision 03; handover PDF pages 2-20';scene['dimensions']='Approximate ~60 m2 nominal room polygons, balcony excluded, before wall deductions'
root=bpy.data.collections.new('nuremberg_apartment');scene.collection.children.link(root)
COL={}
for name in ['Floors','Walls 1.3m','Glazing and openings','Furniture blockout','Balcony rails','Plan reference','Camera shots','Preview lighting']:
 c=bpy.data.collections.new('Nuremberg / '+name);root.children.link(c);COL[name]=c
anchor=bpy.data.objects.new('anchor_nuremberg_origin',None);root.objects.link(anchor)
F=D['xy_scale'];OFFSET=Vector((-5.55*F,-3.25*F,0));H=1.3

def rgb(h):return tuple((int(h[i:i+2],16)/255)**2.2 for i in (1,3,5))
def material(name,col):
 m=bpy.data.materials.new('Nuremberg / '+name);m.diffuse_color=(*rgb(col),1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=m.diffuse_color;p.inputs['Roughness'].default_value=.8;return m
M={key:material(key,col) for key,col in {'plaster':'#EAE5D9','wood floor':'#C6A579','bath tiles':'#D5D5D2','deck':'#A79E80','sofa':'#CEC6AE','cabinet':'#B0C4BB','bed':'#AEBED0','linen':'#F1EDE2','metal':'#56675B','porcelain':'#EAEAE4','glass':'#C0D6DE','appliances':'#DCE0DD','threshold':'#B99662'}.items()}
glassnode=M['glass'].node_tree.nodes.get('Principled BSDF');glassnode.inputs['Transmission Weight'].default_value=.75;glassnode.inputs['Roughness'].default_value=.15

def link(obj,col,parent=True):
 for old in list(obj.users_collection):old.objects.unlink(obj)
 COL[col].objects.link(obj)
 if parent:obj.parent=anchor
 return obj

def box(name,x,y,z,w,d,h,mat,col):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x+OFFSET.x,y+OFFSET.y,z));o=bpy.context.object;o.name='Nuremberg / '+name;o.dimensions=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);link(o,col);return o

# Closed polygon floor meshes, including the L-shaped living room and hall.
for r in D['rooms']:
 pts=[Vector((x+OFFSET.x,y+OFFSET.y,0)) for x,y in r['points']];n=len(pts)
 if sum(pts[i].x*pts[(i+1)%n].y-pts[(i+1)%n].x*pts[i].y for i in range(n))<0:pts.reverse()
 verts=[(p.x,p.y,-.08) for p in pts]+[tuple(p) for p in pts];faces=[]
 for tri in tessellate_polygon([pts]):
  ids=[v if isinstance(v,int) else min(range(n),key=lambda i:(pts[i]-v).length) for v in tri];faces.append(tuple(i+n for i in ids));faces.append(tuple(reversed(ids)))
 for i in range(n):j=(i+1)%n;faces.append((i,j,j+n,i+n))
 mesh=bpy.data.meshes.new('Nuremberg / '+r['name']+' floor');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(mesh.name,mesh);COL['Floors'].objects.link(o);o.parent=anchor;o.data.materials.append(M['bath tiles'] if r['key']=='bathroom' else M['deck'] if r['key']=='balcony' else M['wood floor']);o['room']=r['key'];o['approximate']=True

# Subtract prism intersections so wall junctions have no overlapping surfaces.
def subtract(a,b):
 lo=[max(a[i],b[i]) for i in range(3)];hi=[min(a[i+3],b[i+3]) for i in range(3)]
 if any(hi[i]-lo[i]<1e-7 for i in range(3)):return [a]
 out=[];core=list(a)
 for axis in range(3):
  if core[axis]<lo[axis]:
   q=core.copy();q[axis+3]=lo[axis];out.append(q);core[axis]=lo[axis]
  if core[axis+3]>hi[axis]:
   q=core.copy();q[axis]=hi[axis];out.append(q);core[axis+3]=hi[axis]
 return out
occupied=[]
def wall(axis,fixed,a,b,t,z0,z1,name):
 if b-a<1e-6 or z1-z0<1e-6:return
 prism=[a,fixed-t/2,z0,b,fixed+t/2,z1] if axis=='h' else [fixed-t/2,a,z0,fixed+t/2,b,z1]
 pieces=[prism]
 for old in occupied:pieces=[piece for p in pieces for piece in subtract(p,old)]
 for p in pieces:
  x,y,z,X,Y,Z=p
  if min(X-x,Y-y,Z-z)<1e-6:continue
  o=box(name,(x+X)/2,(y+Y)/2,(z+Z)/2,X-x,Y-y,Z-z,M['plaster'],'Walls 1.3m');o['wall_top_m']=Z;o['wall_bottom_m']=z;occupied.append(p)

for idx,(axis,fixed,a,b,t,gaps) in enumerate(D['walls']):
 cursor=a
 for g in sorted(gaps,key=lambda g:g['a'])+[{'a':b,'b':b}]:wall(axis,fixed,cursor,g['a'],t,0,H,f'Wall {idx+1:02d}');cursor=g['b']
 for g in gaps:
  sill=min(g['sill'],H);head=min(g['head'],H)
  wall(axis,fixed,g['a'],g['b'],t,0,sill,f'Window sill {idx+1:02d}')
  wall(axis,fixed,g['a'],g['b'],t,head,H,f'Lintel {idx+1:02d}')
  width=g['b']-g['a'];mid=(g['a']+g['b'])/2
  if g['kind']=='window' or 'balcony' in g['kind']:
   if head>sill:
    x,y,w,d=(mid,fixed,width,.015) if axis=='h' else (fixed,mid,.015,width)
    o=box(g['kind']+' glazing',x,y,(sill+head)/2,w,d,head-sill,M['glass'],'Glazing and openings');o['opening']=g['kind']
   if g['kind']=='french balcony':
    # Exterior guard only: no projecting balcony floor.
    box('French balcony handrail',fixed-.13,mid,1.05,.035,width,.035,M['metal'],'Balcony rails')
    for k in range(13):box('French balcony upright',fixed-.13,g['a']+width*k/12,.525,.025,.025,1.05,M['metal'],'Balcony rails')
    box('French balcony centre mullion',fixed,mid,.65,.035,.035,1.3,M['metal'],'Glazing and openings')
  else:
   x,y,w,d=(mid,fixed,width,t) if axis=='h' else (fixed,mid,t,width)
   box(g['kind']+' threshold',x,y,.006,w,d,.012,M['threshold'],'Glazing and openings')

# Sparse furniture: low-poly silhouettes, no imported assets or textures.
for name,x,y,w,d,h,col in D['furniture']:
 if name=='Kitchen counter B':w-=.06*F
 if name=='Bed':
  box('Bed frame',x+w/2,y+d/2,.16,w,d,.32,M['bed'],'Furniture blockout');box('Mattress',x+w/2,y+d/2,.4,w*.96,d*.96,.16,M['linen'],'Furniture blockout')
  box('Bed headboard facing kitchen',x+w/2,y+.035,.42,w+.02,.14,.78,M['bed'],'Furniture blockout')
  for px in [x+w*.25,x+w*.75]:box('Pillow',px,y+.32,.515,w*.42,.37,.07,M['linen'],'Furniture blockout')
 elif name=='Sofa':
  box('Sofa base',x+w/2,y+d/2,.2,w,d,.4,M['sofa'],'Furniture blockout');box('Sofa back against bottom wall',x+w/2,y+.07,.46,w+.02,.2,.76,M['sofa'],'Furniture blockout');box('Sofa right arm against corner',x+w-.085,y+d/2-.02,.41,.23,d+.06,.65,M['sofa'],'Furniture blockout')
 elif name=='Sofa chaise':box('Sofa chaise',x+w/2,y+d/2,.22,w,d,.44,M['sofa'],'Furniture blockout')
 elif name=='Bath':
  box('Bath blockout',x+w/2,y+d/2,.27,w,d,.54,M['porcelain'],'Furniture blockout');box('Bath inset',x+w/2,y+d/2,.546,w*.82,d*.72,.012,M['bath tiles'],'Furniture blockout')
 elif name=='Dining table':
  box('Dining tabletop',x+w/2,y+d/2,.73,w,d,.07,M['wood floor'],'Furniture blockout')
  for px in [x+.1,x+w-.1]:
   for py in [y+.1,y+d-.1]:box('Dining table leg',px,py,.35,.08,.08,.7,M['metal'],'Furniture blockout')
 elif name=='Wardrobe':box('Wardrobe / low blockout',x+w/2,y+d/2,.6,w,d,1.2,M['cabinet'],'Furniture blockout')
 elif name=='Boiler':box('Storage boiler / placeholder',x+w/2,y+d/2,.95,w,d,.4,M['appliances'],'Furniture blockout')
 else:
  mat=M['cabinet'] if 'counter' in name else M['porcelain'] if name in ['WC','Basin'] else M['appliances']
  height=min(h,1.25);box(name+' / blockout',x+w/2,y+d/2,height/2,w,d,height,mat,'Furniture blockout')

# Merge the sofa silhouette to remove overlapping interior surfaces.
sofa=bpy.data.objects['Nuremberg / Sofa base']
for part in ['Sofa back against bottom wall','Sofa right arm against corner','Sofa chaise']:
 other=bpy.data.objects['Nuremberg / '+part];mod=sofa.modifiers.new('Join sofa silhouette','BOOLEAN');mod.operation='UNION';mod.solver='EXACT';mod.object=other;bpy.context.view_layer.objects.active=sofa;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(other,do_unlink=True)
sofa.name='Nuremberg / Sofa blockout'

bx=9.9*F;ex=11.1*F;by=6.5*F
box('Balcony outer handrail',ex,by/2,1.05,.04,by,.04,M['metal'],'Balcony rails')
for y in [0,by]:box('Balcony end handrail',(bx+ex)/2,y,1.05,ex-bx,.04,.04,M['metal'],'Balcony rails')
for k in range(23):box('Balcony upright',ex,by*k/22,.525,.025,.025,1.05,M['metal'],'Balcony rails')

# Packed plan reference, excluded from the exported model and preview render.
image=bpy.data.images.load(str(PLAN/'plan-reference.png'));image.pack();ref=bpy.data.objects.new('Nuremberg / approved plan reference',None);ref.empty_display_type='IMAGE';ref.data=image
xmin,ymin,xmax,ymax=D['reference_bounds'];ref.empty_display_size=xmax-xmin;ref.location=((xmin+xmax)/2+OFFSET.x,(ymin+ymax)/2+OFFSET.y,-.1);ref.empty_image_depth='BACK';ref.color[3]=.6;COL['Plan reference'].objects.link(ref);COL['Plan reference'].hide_viewport=True;COL['Plan reference'].hide_render=True

# Authored home shot for the chapter loader. Wall geometry is already capped at 1.3 m.
def camera(name,loc,target,fov=45,ortho=None):
 data=bpy.data.cameras.new(name);o=bpy.data.objects.new(name,data);COL['Camera shots'].objects.link(o);o.location=loc;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler();data.lens_unit='FOV';data.angle=math.radians(fov)
 if ortho:data.type='ORTHO';data.ortho_scale=ortho
 return o
home=camera('shot_home',(-10,12,18),(0,0,.15),45)
top=camera('Nuremberg / top plan',(0,0,18),(0,0,0),ortho=12)
preview=camera('Nuremberg / model overview',(-10,12,20),(0,0,0),ortho=16.0)
world=bpy.data.worlds.new('Nuremberg / studio');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.82,.85,.87,1);world.node_tree.nodes['Background'].inputs[1].default_value=.6
for name,loc,power,size in [('Key',(-3,-4,12),1400,8),('Fill',(3,7,10),1000,7)]:
 data=bpy.data.lights.new('Nuremberg / '+name,'AREA');data.energy=power;data.shape='DISK';data.size=size;o=bpy.data.objects.new(data.name,data);COL['Preview lighting'].objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
scene.camera=preview;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.render.resolution_x=1600;scene.render.resolution_y=1100;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath=str(PLAN/'nuremberg-model-preview.png');bpy.ops.render.render(write_still=True)
scene.camera=home
notes=bpy.data.texts.new('Nuremberg apartment - READ ME');notes.write('Approved plan revision 03. All dimensions approximate.\n\nSelect scene Nuremberg Apartment. Metric units: 1 unit = 1 metre. Z up.\nWalls are 1.3 m high: permanent dollhouse geometry, no temporary cutaway.\nFrench balcony is twice revision 02 width; upper window is at the room end.\nSofa sits in the bottom-right corner. Bed headboard is against bottom wall; feet face kitchen.\nSeparate collections: floors, walls, glazing, furniture blockout, rails, packed plan reference, cameras and preview lights.\nshot_home is an authored perspective camera for the site chapter loader.\nExisting scene Scene (Munich and earlier Nuremberg scaffold) is preserved.\nNo website chapter configuration or served models were changed.\nOriginal file backup: '+str(backup)+'\n')
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.shading.type='MATERIAL';area.spaces.active.region_3d.view_location=(0,0,0);area.spaces.active.region_3d.view_distance=14;area.spaces.active.region_3d.view_rotation=preview.rotation_euler.to_quaternion()
bpy.ops.object.select_all(action='DESELECT')
# Avoid replacing the user's existing rooms.blend1 backup.
old_versions=bpy.context.preferences.filepaths.save_version;bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(FILE));bpy.context.preferences.filepaths.save_version=old_versions
manifest={'original_objects':existing,'original_scenes':original_scenes,'backup':str(backup),'new_scene':SCENE_NAME,'wall_height_m':1.3,'new_meshes':len([o for o in scene.objects if o.type=='MESH']),'new_objects':len(scene.objects)}
(PLAN/'preservation-check.json').write_text(json.dumps(manifest,indent=2))
print('SAVED',FILE,'scene',SCENE_NAME,'meshes',manifest['new_meshes'],'backup',backup)
