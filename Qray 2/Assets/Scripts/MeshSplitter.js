var BVH : BVH;
var fragment : GameObject;

public function SplitMesh(obj : GameObject, maxTris : int) {  //USED FOR DEBUG - VERY SLOW. Returns an object where all its transform children are the mesh fragments.
	maxTris *= 3;  //Because there are 3 vertices per triangle.
	var mesh = obj.GetComponent.<MeshFilter>().mesh;
	var parent = GameObject(obj.name);
	parent.transform.position = obj.transform.position;
	parent.AddComponent(obj.GetComponent.<RenderObject>());  //QRay only by the way. Remove this line if this ain't QRay.
	var remainderTris : int = mesh.triangles.length % maxTris;
	for(var i = 0; i < mesh.triangles.length - (mesh.triangles.length % maxTris); i += maxTris) {
		var o = Instantiate(fragment);
		var v : Vector3[] = new Vector3[maxTris];
		var t : int[] = new int[maxTris];
		var uv : Vector2[] = new Vector2[maxTris];
		for(var ii = 0; ii < maxTris; ii += 3) {  //Makes a triangle.
			v[ii] = mesh.vertices[mesh.triangles[i + ii]];
			v[ii + 1] = mesh.vertices[mesh.triangles[i + ii + 1]];
			v[ii + 2] = mesh.vertices[mesh.triangles[i + ii + 2]];
			t[ii] = ii;
			t[ii + 1] = ii + 1;
			t[ii + 2] = ii + 2;
			uv[ii] = mesh.uv[i + ii];
			//uv[ii + 1] = mesh.uv[i + ii + 1];
			//uv[ii + 2] = mesh.uv[i + ii + 2];
		}
		var mf = o.GetComponent.<MeshFilter>();
		mf.mesh.vertices = v;
		mf.mesh.triangles = t;
		mf.mesh.uv = uv;
		mf.mesh.RecalculateBounds();
		o.transform.SetParent(parent.transform);
	}
	o = Instantiate(fragment);  //Create remainder mesh.
	mf = o.GetComponent.<MeshFilter>();
	mf.mesh.vertices = GetLastVerts(mesh.vertices, remainderTris);
	mf.mesh.triangles = GetLastInts(mesh.triangles, remainderTris);
	mf.mesh.uv = GetLastUVs(mesh.uv, remainderTris);
	mf.mesh.RecalculateBounds();
	return parent;
}

public function SplitMeshToLeafVolumes(obj : GameObject, maxTris : int) {  //Returns a list of volumes where all are the mesh fragments. (For BVH)
	maxTris *= 3;  //Because there are 3 vertices per triangle.
	var mesh = obj.GetComponent.<MeshFilter>().mesh;
	var parent = new Volume[~~(mesh.vertices.length / maxTris) + 1];
	//parent.bounds.position = obj.transform.position;
	var id = obj.GetComponent.<RenderObject>().id;  //QRay only by the way. Remove this line if this ain't QRay.
	var remainderTris : int = mesh.triangles.length % maxTris;
	for(var i = 0; i < mesh.triangles.length - (mesh.triangles.length % maxTris); i += maxTris) {
		var o = Instantiate(fragment);
		var v : Vector3[] = new Vector3[maxTris];
		var t : int[] = new int[maxTris];
		var uv : Vector2[] = new Vector2[maxTris];
		for(var ii = 0; ii < maxTris; ii += 3) {  //Makes a triangle.
			v[ii] = mesh.vertices[mesh.triangles[i + ii]];
			v[ii + 1] = mesh.vertices[mesh.triangles[i + ii + 1]];
			v[ii + 2] = mesh.vertices[mesh.triangles[i + ii + 2]];
			t[ii] = ii;
			t[ii + 1] = ii + 1;
			t[ii + 2] = ii + 2;
			//uv[ii] = mesh.uv[i + ii];
			//uv[ii + 1] = mesh.uv[i + ii + 1];
			//uv[ii + 2] = mesh.uv[i + ii + 2];
		}
		var m : Mesh = new Mesh();
		m.vertices = v;
		m.triangles = t;
		m.uv = uv;
		m.RecalculateBounds();
		parent[i / 3].meshChild = m;
		parent[i / 3].bounds = m.bounds;
		parent[i / 3].id = id;
	}
	var m2 = new Mesh();  //Create last triangle cluster volume.
	m2.vertices = GetLastVerts(mesh.vertices, remainderTris);
	m2.triangles = GetLastInts(mesh.triangles, remainderTris);
	m2.uv = GetLastUVs(mesh.uv, remainderTris);
	m2.RecalculateBounds();
	parent[parent.length - 1].meshChild = m2;
	parent[parent.length - 1].bounds = m2.bounds;
	parent[parent.length - 1].id = id;
	return parent;  //Array of volumes, not empty object.
}


function GetLastVerts(a : Vector3[], range : int) : Vector3[] {
	Debug.Log(range.ToString() + "   " + a.length.ToString());
	Debug.Log(a[0]);
	var x : Vector3[] = new Vector3[range];
	for(var i = 0; i < range; i++) {
		Debug.Log(i);
		x[i] = a[(a.length -1) - i];
	}
	return x;
}

function GetLastUVs(a : Vector2[], range : int) : Vector2[] {
	var x : Vector2[] = new Vector2[range];
	for(var i = 0; i < range; i++) {
		x[i] = a[(a.length -1) - i];
	}
	return x;
}

function GetLastInts(a : int[], range : int) : int[] {
	var x : int[] = new int[range];
	for(var i = 0; i < range; i++) {
		x[i] = a[(a.length -1) - i];
	}
	return x;
}