class PhysicsObject {
  constructor(scene, world, body, mesh) {
    this.body = body;
    this.mesh = mesh;
    this.scene = scene;
    this.world = world;
    this.timer = -1;
    this.disposed = false;
  }

  update() {
    if (this.disposed) return;

    if (this.timer > 0) {
      this.timer--;
      if (this.timer === 0) {
        this.dispose();
        return;
      }
    }

    let mesh = this.mesh;
    let body = this.body;
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.material.dispose();
    this.mesh.geometry.dispose();
    this.world.removeBody(this.body);
  }
}

export default PhysicsObject;
