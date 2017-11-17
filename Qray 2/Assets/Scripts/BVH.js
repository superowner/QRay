import System.Linq;

var MeshSplitter : MeshSplitter;  //Needed to fragment the objects.
public var root : Volume;
public var maxBaseChildren : int = 6;

//ONLY BASE (LEAF) VOLUMES SHOULD CONTAIN MESH CHILDREN.
public class Volume {
	var bounds : Bounds = Bounds(Vector3.zero, Vector3.zero);
	var children : Volume[];
	var meshChild : Mesh;
	var transformChild : Transform;
	var id : int = 0;  //Refers to what RenderObject instance to use. Default is unidentified at -1. Jk it's not for now.
	public function Volume(b, c, m, t, i) {
		this.bounds = b;
		this.children = c;
		this.meshChild = m;
		this.transformChild = t;
		this.id = i;
	}
}

public class RayHit {  //In JS, you can't ref stuff, so the boolean and raycast hit have to be returned in an object.
	var hit : boolean;
	var hitInfo : RaycastHit;
	var id : int;
	public function RayHit(h, i, id) {
		this.hit = h;
		this.hitInfo = i;
		this.id = id;
	}
}

public function GenerateBVH() {  //All RenderObjects must have colliders!
	var renderObjects = GameObject.FindGameObjectsWithTag("RenderObject");  //Temporary solution to getting fragments.
	var leafVolumes : Volume[];
	for(obj in renderObjects) {
		leafVolumes.Concat(MeshSplitter.SplitMeshToLeafVolumes(obj, 72)).ToArray(); //Adds a crapload of volumes with triangles in them. Second argument is the max tri count per leaf volume.
	}
	root.bounds = BoundVolumes(leafVolumes);
	root.children = SubChildren(SubdivideVolume(root), leafVolumes, maxBaseChildren);  //BVH generated.
}

function ObjectFragsToVolumes(objects : GameObject[]) {  //Don't need to use unless for debug stuff.
	var volumes : Volume[] = new Volume[objects.length];
	for(var i : int = 0; i < volumes.length; i++) {
		volumes[i].bounds = objects[i].GetComponent.<MeshFilter>().mesh.bounds;
		volumes[i].meshChild = objects[i].GetComponent.<MeshFilter>().mesh;
	}
	return volumes;
}

function BoundObjects(objects : GameObject[]) {
	var b = Bounds(Vector3.zero, Vector3.zero);
	for(var i : int = 0; i < objects.length; i++) {
		if(objects[i].GetComponent.<MeshFilter>().mesh.bounds.extents == Vector3.zero) {  //For the first object bound only.
			b = objects[i].GetComponent.<MeshFilter>().mesh.bounds;
		}
		b.Encapsulate(objects[i].GetComponent.<MeshFilter>().mesh.bounds);
	}
	return b; //Returns the Bounds of all of the objects together.
}

function BoundVolumes(volumes : Volume[]) {
	var b = Bounds(Vector3.zero, Vector3.zero);
	for(var i : int = 0; i < volumes.length; i++) {
		if(volumes[i].bounds.extents == Vector3.zero) {  //For the first object bound only.
			b = volumes[i].bounds;
		}
		b.Encapsulate(volumes[i].bounds);
	}
	return b; //Returns the Bounds of all of the objects together.
}

function SubdivideVolume(vol : Volume) {  //Creates 8 more subdivided volumes inside input volume. Imagine a cube made of 8 smaller cubes.
	var volumes : Volume[] = new Volume[8];
	volumes[0].bounds.extents = Vector3.Scale(vol.bounds.extents, Vector3(1,1,1)) * 0.5;  //Top 4 subdivisions, hence positive z axis.
	volumes[0].bounds.centre = vol.bounds.centre + volumes[0].bounds.extents;
	volumes[1].bounds.extents = Vector3.Scale(vol.bounds.extents, Vector3(1,-1,1)) * 0.5;
	volumes[1].bounds.centre = vol.bounds.centre + volumes[1].bounds.extents;
	volumes[2].bounds.extents = Vector3.Scale(vol.bounds.extents, Vector3(-1,-1,1)) * 0.5;
	volumes[2].bounds.centre = vol.bounds.centre + volumes[2].bounds.extents;
	volumes[3].bounds.extents = Vector3.Scale(vol.bounds.extents, Vector3(-1,1,1)) * 0.5;
	volumes[3].bounds.centre = vol.bounds.centre + volumes[3].bounds.extents;
	volumes[4].bounds.extents = Vector3.Scale(vol.bounds.extents, Vector3(1,1,-1)) * 0.5;  //Bottom 4 subdivisions, hence negative z axis.
	volumes[4].bounds.centre = vol.bounds.centre + volumes[4].bounds.extents;
	volumes[5].bounds.extents = Vector3.Scale(vol.bounds.extents, Vector3(1,-1,-1)) * 0.5;
	volumes[5].bounds.centre = vol.bounds.centre + volumes[5].bounds.extents;
	volumes[6].bounds.extents = Vector3.Scale(vol.bounds.extents, Vector3(-1,-1,-1)) * 0.5;
	volumes[6].bounds.centre = vol.bounds.centre + volumes[6].bounds.extents;
	volumes[7].bounds.extents = Vector3.Scale(vol.bounds.extents, Vector3(-1,1,-1)) * 0.5;
	volumes[7].bounds.centre = vol.bounds.centre + volumes[7].bounds.extents;
	return volumes;
}

function BoundVolumesToClusters(volumes : Volume[], clusterVolumes : Volume[]) {  //Creates sub bounds for the input volumes based on the input cluster volumes.
	for(var i : int = 0; i < clusterVolumes.length; i++) {
		for(var ii : int = 0; ii < volumes.length; ii++) {
			if(clusterVolumes[i].bounds.Contains(volumes[ii].bounds.centre)) {
				clusterVolumes[i].children.Add(volumes[ii]);
			}
		}
		if(clusterVolumes[i].children.length == 0) {  //No children - delete the node.
				clusterVolumes.RemoveAt(i);
				i--;
		}
		clusterVolumes[i].bounds = BoundVolumes(clusterVolumes[i].children);
	}
	return clusterVolumes;  //The new sub-bounding-volumes!
}

function SubChildren(childVolumes : Volume[], baseVolumes : Volume[], maxChildren : int) : Volume[] {  //Takes children volumes and makes more children volumes for them.
	for(var i : int = 0; i < childVolumes.length; i++) {
		childVolumes[i].children = BoundVolumesToClusters(baseVolumes, SubdivideVolume(childVolumes[i]));
		if(childVolumes[i].children.length > maxChildren) {
			SubChildren(childVolumes[i].children, baseVolumes, maxChildren);  //Recursive for multidimensional arrays.
		}
	}
	return childVolumes;
}

public function Raycast(ray : Ray, raycastHit : RaycastHit, max : float) {
	var hitVolume : Volume;
	if(Intersection(ray, root, hitVolume)) {
		var hit : RaycastHit;
		var tmp : GameObject = new GameObject("coll");
		tmp.transform.position = hitVolume.transformChild.position;
		tmp.transform.localScale = hitVolume.transformChild.localScale;
		tmp.transform.rotation = hitVolume.transformChild.rotation;
		var coll = tmp.AddComponent.<MeshCollider>();
		tmp.transform.position = hitVolume.bounds.position;
		coll.sharedMesh = null;
		coll.sharedMesh = hitVolume.meshChild;
		if(coll.Raycast(ray, hit, max)) { //Only performs an intersection test on this fragment of mesh.
			raycastHit = hit;
			return true;
		}
	}
	else {
		return false;
	}
}

public function Raycast2(ray : Ray, raycastHit : RaycastHit, max : float) {
	var hitVolume : Volume;
	if(Intersection(ray, root, hitVolume)) {
		var hit : RaycastHit;
		var tmp : GameObject = new GameObject("coll");
		tmp.transform.position = hitVolume.transformChild.position;
		tmp.transform.localScale = hitVolume.transformChild.localScale;
		tmp.transform.rotation = hitVolume.transformChild.rotation;
		var coll = tmp.AddComponent.<MeshCollider>();
		tmp.transform.position = hitVolume.bounds.position;
		coll.sharedMesh = null;
		coll.sharedMesh = hitVolume.meshChild;
		if(coll.Raycast(ray, hit, max)) { //Only performs an intersection test on this fragment of mesh.
			raycastHit = hit;
			return RayHit(true, hit, hitVolume.id);
		}
	}
	else {
		return RayHit(false, null, null);
	}
}

function Intersection(ray : Ray, volume : Volume, volumeHit : Volume) : boolean {  //Returns the base volume that the ray intersects.
	var vol : Volume;
	for(var i : int = 0; i < volume.children.length; i++) {
		if(volume.children[i].bounds.IntersectRay(ray)) {
			vol = volume.children[i];
			if(volume.children[i].length > 0) {
				return Intersection(ray, vol, volumeHit);
			}
			else {
				volumeHit = vol;
				return true;
			}
		}
	}
	return false;  //Never hit anything...
}