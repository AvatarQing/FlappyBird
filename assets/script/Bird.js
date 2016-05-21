const State = cc.Enum({
    /** 游戏开始前的准备状态 */
    Ready: -1,
    /** 小鸟上升中 */
    Rise: -1,
    /** 小鸟自由落体中 */
    FreeFall: -1,
    /** 小鸟碰撞到管道坠落中 */
    Drop: -1,
    /** 小鸟已坠落到地面静止 */
    Dead: -1,
});

cc.Class({
    statics: {
        State: State
    },

    extends: cc.Component,

    properties: {
        /** 上抛初速度，单位：像素/秒 */
        initRiseSpeed: 800,
        /** 重力加速度，单位：像素/秒的平方 */
        gravity: 1000,
        /** 小鸟的状态 */
        state: {
            default: State.Ready,
            type: State,
        },
        /** 地面节点 */
        ground: {
            default: null,
            type: cc.Node
        },
        /** 小鸟向上飞的声音 */
        riseAudio: {
            default: null,
            url: cc.AudioClip
        },
        /** 小鸟碰撞到水管后开始坠落的声音 */
        dropAudio: {
            default: null,
            url: cc.AudioClip
        },
        /** 小鸟发生碰撞的声音 */
        hitAudio: {
            default: null,
            url: cc.AudioClip
        },
    },

    init(game){
        this.game = game;
        this.state = State.Ready;
        this.currentSpeed = 0;
        this.anim = this.getComponent(cc.Animation);
        this.anim.playAdditive("birdFlapping");
    },

    startFly () {
        this._getNextPipe();
        this.anim.stop("birdFlapping");
        this.rise();
    },

    _getNextPipe () {
        this.nextPipe = this.game.pipeManager.getNext();
    },

    update (dt) {
        if (this.state === State.Ready || this.state === State.Dead) {
            return;
        }
        this._updatePosition(dt);
        this._updateState(dt);
        this._detectCollision();
        this._fixBirdFinalPosition();
    },

    _updatePosition (dt) {
        var flying = this.state === State.Rise
            || this.state === State.FreeFall
            || this.state === State.Drop;
        if (flying) {
            this.currentSpeed -= dt * this.gravity;
            this.node.y += dt * this.currentSpeed;
        }
    },

    _updateState (dt) {
        switch (this.state) {
            case State.Rise:
                if (this.currentSpeed < 0) {
                    this.state = State.FreeFall;
                    this._runFallAction();
                }
                break;
            case State.Drop:
                if (this._detectCollisionWithBird(this.ground)) {
                    this.state = State.Dead;
                }
                break;
        }
    },

    _detectCollision () {
        if (!this.nextPipe) {
            return;
        }
        if (this.state === State.Ready || this.state === State.Dead || this.state === State.Drop) {
            return;
        }
        let collideWithPipe = false;
        // 检测小鸟与上方管子的碰撞
        if (this._detectCollisionWithBird(this.nextPipe.topPipe)) {
            collideWithPipe = true;
        }
        // 检测小鸟与下方管子的碰撞
        if (this._detectCollisionWithBird(this.nextPipe.bottomPipe)) {
            collideWithPipe = true;
        }
        // 检测小鸟与地面的碰撞
        let collideWithGround = false;
        if (this._detectCollisionWithBird(this.ground)) {
            collideWithGround = true;
        }
        // 处理碰撞结果
        if (collideWithPipe || collideWithGround) {
            cc.audioEngine.playEffect(this.hitAudio);

            if (collideWithGround) { // 与地面碰撞
                this.state = State.Dead;
            } else { // 与水管碰撞
                this.state = State.Drop;
                this._runDropAction();
                this.scheduleOnce(()=> {
                    cc.audioEngine.playEffect(this.dropAudio);
                }, 0.3);
            }

            this.anim.stop();
            this.game.gameOver();
        } else { // 处理没有发生碰撞的情况
            let birdLeft = this.node.x;
            let pipeRight = this.nextPipe.node.x + this.nextPipe.topPipe.width
            let crossPipe = birdLeft > pipeRight;
            if (crossPipe) {
                this.game.gainScore();
                this._getNextPipe();
            }
        }
    },

    /** 修正最后落地位置 */
    _fixBirdFinalPosition(){
        if (this._detectCollisionWithBird(this.ground)) {
            this.node.y = this.ground.y + this.node.width / 2;
        }
    },

    _detectCollisionWithBird(otherNode){
        return cc.rectIntersectsRect(this.node.getBoundingBoxToWorld(), otherNode.getBoundingBoxToWorld());
    },

    rise() {
        this.state = State.Rise;
        this.currentSpeed = this.initRiseSpeed;
        this._runRiseAction();
        cc.audioEngine.playEffect(this.riseAudio);
    },

    _runRiseAction(){
        this.node.stopAllActions();
        let jumpAction = cc.rotateTo(0.3, -30).easing(cc.easeCubicActionOut());
        this.node.runAction(jumpAction);
    },

    _runFallAction(duration = 0.6){
        this.node.stopAllActions();
        let dropAction = cc.rotateTo(duration, 90).easing(cc.easeCubicActionIn());
        this.node.runAction(dropAction);
    },

    _runDropAction(){
        if (this.currentSpeed > 0) {
            this.currentSpeed = 0;
        }
        this._runFallAction(0.4);
    }
});
