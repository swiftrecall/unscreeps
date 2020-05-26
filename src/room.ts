Room.prototype.status = function () {
  if (!this.memory.lifeCycleStatus) {
    this.memory.lifeCycleStatus = RoomLifeCycleStatus.Unowned;
  }
  return this.memory.lifeCycleStatus;
};

Room.prototype.init = function () {};
