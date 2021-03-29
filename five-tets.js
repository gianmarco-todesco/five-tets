const goldenRatio = (1+Math.sqrt(5))/2;
const theta = Math.atan(1/goldenRatio);

let canvas, engine, scene, camera, light1;
let root;

window.addEventListener('DOMContentLoaded', (event) => {
    canvas = document.getElementById('renderCanvas');
    canvas.addEventListener('wheel', evt => evt.preventDefault());
    engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);
    camera = new BABYLON.ArcRotateCamera('cam', 
        Math.PI/2, 2.15,
        20, 
        new BABYLON.Vector3(0,0,0), 
        scene);
    camera.attachControl(canvas,true);
    camera.wheelPrecision = 50;
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 13*2;            
    let light1 = new BABYLON.PointLight('light1',new BABYLON.Vector3(0,1,0), scene);
    light1.parent = camera;

    populateScene(scene);
    
    engine.runRenderLoop(()=>scene.render());
    window.addEventListener("resize", () => engine.resize());
});


function populateScene(scene) {
    
    root = new BABYLON.Mesh("root",scene);
    let tets = [];

    const colors = [
        [0.8,0.2,0.1],
        [0.8,0.4,0.1],
        [0.8,0.8,0.1],
        [0.4,0.8,0.1],
        [0.8,0.4,0.8]];

    // create texture
    let sz = 1024;
    let tx0 = 0.2, tx1 = 1 - tx0;
    let ty0 = 0.2 , ty1 = ty0 + 0.6 * Math.sqrt(3)/2;
    let texture = new BABYLON.DynamicTexture('texture', {width:sz, height:sz}, scene);
    let ctx = texture.getContext();
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0,sz,sz);
    ctx.beginPath();
    ctx.moveTo(sz*tx0,sz*ty0);
    ctx.lineTo(sz*tx1,sz*ty0);
    ctx.lineTo(sz*(tx0+tx1)*0.5,sz*ty1);
    ctx.lineTo(sz*tx0,sz*ty0);
    ctx.closePath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 20;
    ctx.stroke();
    ctx.fillStyle = 'black';
    //ctx.fillRect(0,0,1024,1024);
    
    texture.update();

    // create tets
    for(let i=0; i<5; i++) {


        let vd = new BABYLON.VertexData();
        vd.positions = [];
        vd.indices = [];
        vd.uvs = [];
        let pts = [[-1,-1,-1], [-1,1,1], [1,-1,1], [1,1,-1]];
        let faces = [[0,1,2],[1,0,3],[2,1,3],[0,2,3]];
        for(let i=0; i<4; i++) {
            const [a,b,c] = faces[i];
            vd.positions.push(...pts[a]);
            vd.positions.push(...pts[b]);
            vd.positions.push(...pts[c]);
            vd.indices.push(i*3,i*3+1,i*3+2);
            vd.uvs.push(tx0,1-ty0,tx1,1-ty0,0.5,1-ty1);
        }
        vd.normals = [];
        BABYLON.VertexData.ComputeNormals(
            vd.positions, 
            vd.indices, 
            vd.normals);
        tet = new BABYLON.Mesh('tet', scene);
        vd.applyToMesh(tet);
        tet.parent = root;

        let mat = new BABYLON.StandardMaterial('m'+i, scene);
        mat.diffuseColor.set(...colors[i]);
        mat.specularColor.set(0.3,0.3,0.3);
        mat.diffuseTexture = texture;
        tet.material = mat;

        // tet.isVisible = false;

        // rotate i-th tet
        tet.rotation.y = 2*Math.PI*i/5;
        tet.rotation.x = theta;

        // and add to list
        tets.push(tet);
    }

    // animation
    scene.registerBeforeRender(() => {
        let t = performance.now() * 0.001;
        
        root.rotationQuaternion = 
            BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Z, t).multiply(
            BABYLON.Quaternion.RotationAxis(BABYLON.Axis.X, Math.PI/2));
        
        let R = 6;
        tets.forEach((tet,i) => {

            let t1 = t * 0.1 + 0.04 * i;

            let t2 = t1 - Math.floor(t1);

            let param = smooth(
                step(t2,0.22,0.28) - 
                step(t2,0.72,0.78));        
    
            let phi = tet.rotation.y;

            // start position
            let p0 = new BABYLON.Vector3(Math.sin(phi)*R,0,Math.cos(phi)*R);

            // end position
            let p1 = new BABYLON.Vector3(0,0,0);

            // move the tet
            tet.position.copyFrom(BABYLON.Vector3.Lerp(p0,p1,param));

            // and rotate it
            tet.rotation.x = (1-param)*0 + param*theta;

        });

    });
}

function step(t, t0, t1) {
    return t<=t0 ? 0 : t>=t1 ? 1 : (t-t0)/(t1-t0);
}

function smooth(t) {
    return t<0 ? 0 : t>1 ? 1 : (1-Math.cos(Math.PI*t))/2;
}
