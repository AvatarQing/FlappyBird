const PipeGroup = require('PipeGroup');

cc.Class({
    extends: cc.Component,

    properties: {
        /** 管道节点预制资源 */
        pipePrefab: cc.Prefab,
        /** 管道移动速度，单位px/s */
        pipeMoveSpeed: -300,
        /** 每对管道之间的间距，单位px */
        pipeSpacing: 400
    },

    onLoad() {
        this.pipeList = [];
        this.isRunning = false;
    },

    startSpawn(){
        this._spawnPipe();
        let spawnInterval = Math.abs(this.pipeSpacing / this.pipeMoveSpeed);
        this.schedule(this._spawnPipe, spawnInterval);
        this.isRunning = true;
    },

    _spawnPipe(){
        let pipeGroup = null;
        if (cc.pool.hasObject(PipeGroup)) {
            pipeGroup = cc.pool.getFromPool(PipeGroup);
        } else {
            pipeGroup = cc.instantiate(this.pipePrefab).getComponent(PipeGroup);
        }
        this.node.addChild(pipeGroup.node);
        pipeGroup.node.active = true;
        pipeGroup.init(this);
        this.pipeList.push(pipeGroup);
    },

    recyclePipe(pipe) {
        pipe.node.removeFromParent();
        pipe.node.active = false;
        cc.pool.putInPool(pipe);
    },

    /** 获取下个未通过的水管 */
    getNext() {
        return this.pipeList.shift();
    },

    reset() {
        this.unschedule(this._spawnPipe);
        this.pipeList = [];
        this.isRunning = false;
    }
});
