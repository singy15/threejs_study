class PhysicsObjectManager {
  constructor() {
    this.objects = [];
  }

  addObject(po) {
    this.objects.push(po);
  }

  updateAll() {
    this.objects.forEach((po) => {
      po.update();
    });
  }

  clean() {
    this.objects = this.objects.filter((o) => !o.disposed);
  }
}

export default PhysicsObjectManager;
