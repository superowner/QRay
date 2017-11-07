using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System;

//All the QRay speific extensions onto pre-existing (Unity API) classes.
public static class ExtensionMethods
{
	public static T GetCopyOf<T>(this Component comp, T other) where T : Component {
	    Type type = comp.GetType();
	    if (type != other.GetType()) return null; // type mis-match
	    BindingFlags flags = BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Default | BindingFlags.DeclaredOnly;
	    PropertyInfo[] pinfos = type.GetProperties(flags);
	    foreach (var pinfo in pinfos) {
	        if (pinfo.CanWrite) {
	            try {
	                pinfo.SetValue(comp, pinfo.GetValue(other, null), null);
	            }
	            catch { } // In case of NotImplementedException being thrown. For some reason specifying that exception didn't seem to catch it, so I didn't catch anything specific.
	        }
    	}
     	FieldInfo[] finfos = type.GetFields(flags);
     	foreach (var finfo in finfos) {
        	finfo.SetValue(comp, finfo.GetValue(other));
     	}
    	return comp as T;
 	}

	public static T AddComponent<T>(this GameObject go, T toAdd) where T : Component {  //Allows components to be copied from one GameObject to another.
    	return go.AddComponent<T>().GetCopyOf(toAdd) as T;
 	}

	public static Vector3 SmoothedNormal(this RaycastHit aHit)
 	{
     var MC = aHit.collider as MeshCollider;
     if (MC == null)
         return aHit.normal;
     var M = MC.sharedMesh;
     var normals = M.normals;
     var indices = M.triangles;
     var N0 = normals[indices[aHit.triangleIndex*3 + 0]];
     var N1 = normals[indices[aHit.triangleIndex*3 + 1]];
     var N2 = normals[indices[aHit.triangleIndex*3 + 2]];
     var B = aHit.barycentricCoordinate;
     var localNormal = (B[0] * N0 + B[1] * N1 + B[2] * N2).normalized;
     return MC.transform.TransformDirection(localNormal);
 	}

		public class CMeshInfo
	{
	    public Collider collider;
	    public Vector3[] normals;
	    public int[] indices;
	}

	private static int MAX_CACHE = 3;
	private static List< CMeshInfo > m_MeshCache = new List< CMeshInfo >();

	public static Vector3 SmoothedNormalCached(this RaycastHit aHit)
	{
	    var MC = aHit.collider as MeshCollider;
	    if (MC == null)
	        return aHit.normal;
	    var cacheObj = m_MeshCache.Find(meshinfo => meshinfo.collider == MC);
	    if (cacheObj == null)
	    {
	        var M = MC.sharedMesh;
	        cacheObj = new CMeshInfo();
	        cacheObj.collider = MC;
	        cacheObj.indices = M.triangles;
	        cacheObj.normals = M.normals;
	    }
	    else
	       m_MeshCache.Remove(cacheObj);
	    m_MeshCache.Add(cacheObj);
	    while (m_MeshCache.Count > MAX_CACHE)
	        m_MeshCache.RemoveAt(0);
	     
	    var N0 = cacheObj.normals[cacheObj.indices[aHit.triangleIndex*3 + 0]];
	    var N1 = cacheObj.normals[cacheObj.indices[aHit.triangleIndex*3 + 1]];
	    var N2 = cacheObj.normals[cacheObj.indices[aHit.triangleIndex*3 + 2]];
	    var B = aHit.barycentricCoordinate;
	    var localNormal = (B[0] * N0 + B[1] * N1 + B[2] * N2).normalized;
	    return MC.transform.TransformDirection(localNormal);
	 }

}