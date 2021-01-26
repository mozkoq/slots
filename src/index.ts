import * as PIXI from "pixi.js";
import { Container, Sprite } from "pixi.js";

import "./style.css";

const gameWidth = 2560;
const gameHeight = 1440;
const SYMBOL_SIZE = 334;
const REEL_WIDTH = 430;
const symbols = ["H1", "H2", "H3", "H4", "L1", "L2", "L3", "L4", "WILD"];
const machineStates: MachineResult[] = [
    {
        reels: [
            ["H1", "L2", "L1"],
            ["L2", "H1", "L1"],
            ["L3", "H2", "H4"],
        ],
        win: 0,
    },
    {
        reels: [
            ["H1", "L2", "L4"],
            ["L2", "H1", "L1"],
            ["L3", "L2", "H4"],
        ],
        win: 50,
    },
    {
        reels: [
            ["H1", "L2", "L1"],
            ["L2", "H1", "L1"],
            ["L3", "H2", "WILD"],
        ],
        win: 400,
    },
    {
        reels: [
            ["WILD", "L2", "L1"],
            ["WILD", "H1", "L1"],
            ["WILD", "H2", "H4"],
        ],
        win: 500,
    },
    {
        reels: [
            ["L1", "L2", "L4"],
            ["L1", "H1", "L3"],
            ["L1", "H2", "H4"],
        ],
        win: 75,
    },
    {
        reels: [
            ["H1", "H3", "L1"],
            ["L2", "H3", "L1"],
            ["L3", "H3", "H4"],
        ],
        win: 125,
    },
    {
        reels: [
            ["H1", "L2", "H4"],
            ["L2", "H1", "H4"],
            ["L3", "H2", "H4"],
        ],
        win: 100,
    },
    {
        reels: [
            ["L1", "H4", "H1"],
            ["H1", "L3", "L2"],
            ["L3", "H2", "H3"],
        ],
        win: 0,
    },
    {
        reels: [
            ["L4", "H1", "L1"],
            ["H3", "L2", "H2"],
            ["WILD", "H2", "L1"],
        ],
        win: 0,
    },
    {
        reels: [
            ["H3", "L4", "WILD"],
            ["H3", "H1", "L1"],
            ["L1", "H3", "L2"],
        ],
        win: 0,
    },
];

const app = new PIXI.Application({
    backgroundColor: 0xffffff,
    width: gameWidth,
    height: gameHeight,
});

const stage = app.stage;

window.onload = async (): Promise<void> => {
    await loadGameAssets();

    document.body.appendChild(app.view);

    const { reelContainer, startPlay } = buildReel();

    stage.addChild(getBackground());
    stage.addChild(getReels());
    stage.addChild(getCounter());
    stage.addChild(getSpinButton(startPlay));
    stage.addChild(reelContainer);

    resizeCanvas();
};

async function loadGameAssets(): Promise<void> {
    return new Promise((res, rej) => {
        const loader = PIXI.Loader.shared;
        loader
            .add("./assets/bg.jpg", "./assets/bg.jpg")
            .add("./assets/button_spin.png", "./assets/button_spin.png")
            .add("./assets/counter.png", "./assets/counter.png")
            .add("./assets/reels.png", "./assets/reels.png")
            .add("./assets/symbols/H1.png", "./assets/symbols/H1.png")
            .add("./assets/symbols/H2.png", "./assets/symbols/H2.png")
            .add("./assets/symbols/H3.png", "./assets/symbols/H3.png")
            .add("./assets/symbols/H4.png", "./assets/symbols/H4.png")
            .add("./assets/symbols/L1.png", "./assets/symbols/L1.png")
            .add("./assets/symbols/L2.png", "./assets/symbols/L2.png")
            .add("./assets/symbols/L3.png", "./assets/symbols/L3.png")
            .add("./assets/symbols/L4.png", "./assets/symbols/L4.png")
            .add("./assets/symbols/WILD.png", "./assets/symbols/WILD.png");
        loader.onComplete.once(() => {
            res();
        });

        loader.onError.once(() => {
            rej();
        });

        loader.load();
    });
}

const resizeCanvas = (): void => {
    const resize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        app.stage.scale.x = window.innerWidth / gameWidth;
        app.stage.scale.y = window.innerHeight / gameHeight;
    };

    resize();
    window.addEventListener("resize", resize);
};

const getBackground = () => {
    const background = new PIXI.Sprite(PIXI.Texture.from("./assets/bg.jpg"));
    background.position.x = -760;
    background.position.y = -1330;
    return background;
};

const getReels = () => {
    const reels = new PIXI.Sprite(PIXI.Texture.from("./assets/reels.png"));
    reels.position.set(gameWidth / 4.2, gameHeight / 40);

    return reels;
};

const getSpinButton = (startPlay: () => void) => {
    const spinButton = new PIXI.Sprite(PIXI.Texture.from("./assets/button_spin.png"));
    spinButton.anchor.set(0.5, 0.5);
    spinButton.position.set(gameWidth - 350, gameHeight / 2.3);
    spinButton.interactive = true;
    spinButton.buttonMode = true;
    spinButton.addListener("pointerdown", () => {
        startPlay();
    });

    return spinButton;
};

const getCounter = () => {
    const counter = new PIXI.Sprite(PIXI.Texture.from("./assets/counter.png"));
    counter.anchor.set(0.5, 0.5);
    counter.position.set(gameWidth / 2, gameHeight - 150);

    return counter;
};

const getRandomSymbol = () => {
    const symbol = new PIXI.Sprite(
        PIXI.Texture.from(`./assets/symbols/${symbols[Math.floor(Math.random() * symbols.length)]}.png`)
    );

    return symbol;
};

const buildReel = () => {
    const reels: {
        symbols: Sprite[];
        container: Container;
        position: number;
        previousPosition: number;
        blur: PIXI.filters.BlurFilter;
    }[] = [];
    const reelContainer = new PIXI.Container();
    reelContainer.x = Math.round(gameWidth / 3.8);
    reelContainer.y = 60;

    for (let i = 0; i < 3; i++) {
        const rc = new PIXI.Container();
        rc.x = i * REEL_WIDTH;
        reelContainer.addChild(rc);

        const reel: {
            symbols: Sprite[];
            container: Container;
            position: number;
            previousPosition: number;
            blur: PIXI.filters.BlurFilter;
        } = {
            symbols: [],
            container: rc,
            position: 0,
            previousPosition: 0,
            blur: new PIXI.filters.BlurFilter(),
        };
        reel.blur.blurX = 0;
        reel.blur.blurY = 0;
        rc.filters = [reel.blur];

        for (let j = 0; j < 4; j++) {
            const symbol = getRandomSymbol();
            symbol.y = j * SYMBOL_SIZE;
            symbol.scale.x = symbol.scale.y = Math.min(SYMBOL_SIZE / symbol.width, SYMBOL_SIZE / symbol.height);
            symbol.x = Math.round((SYMBOL_SIZE - symbol.width) / 2);
            reel.symbols.push(symbol);
            rc.addChild(symbol);
        }
        reels.push(reel);
    }

    let running = false;
    let machineResult: MachineResult;

    const startPlay = () => {
        if (running) return;
        running = true;
        machineResult = machineStates[Math.floor(Math.random() * machineStates.length)];

        for (let i = 0; i < reels.length; i++) {
            const r = reels[i];
            const target = r.position + 12;
            const time = 3000 + i * 600;
            tweenTo(r, "position", target, time, backout(1), null, i === reels.length - 1 ? reelsComplete : null);
        }
    };

    const reelsComplete = () => {
        running = false;
    };

    app.ticker.add(() => {
        for (let i = 0; i < reels.length; i++) {
            const r = reels[i];
            r.blur.blurY = (r.position - r.previousPosition) * 8;
            r.previousPosition = r.position;

            for (let j = 0; j < r.symbols.length; j++) {
                const s = r.symbols[j];
                const prevy = s.y;
                s.y = ((r.position + j) % r.symbols.length) * (SYMBOL_SIZE + 50) - (SYMBOL_SIZE + 50);
                if (s.y < 0 && prevy > SYMBOL_SIZE) {
                    if (j !== 0) {
                        s.texture = PIXI.Texture.from(`./assets/symbols/${machineResult.reels[j - 1][i]}.png`);
                        s.scale.x = s.scale.y = Math.min(SYMBOL_SIZE / s.texture.width, SYMBOL_SIZE / s.texture.height);
                        s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
                    }
                }
            }
        }
    });

    const createMaskForReels = () => {
        reelContainer.mask = new PIXI.Graphics()
            .beginFill(0xffffff)
            .drawRect(0, window.innerHeight * 0.028, window.innerWidth, window.innerHeight * 0.79)
            .endFill();
    };
    createMaskForReels();
    window.addEventListener("resize", createMaskForReels);

    return { reelContainer, startPlay };
};

const tweening: any[] = [];
const tweenTo = (
    object: { [x: string]: any },
    property: string,
    target: any,
    time: number,
    easing: (t: any) => number,
    onchange: null,
    oncomplete: (() => void) | null
) => {
    const tween = {
        object,
        property,
        propertyBeginValue: object[property],
        target,
        easing,
        time,
        change: onchange,
        complete: oncomplete,
        start: Date.now(),
    };

    tweening.push(tween);
    return tween;
};
app.ticker.add(() => {
    const now = Date.now();
    const remove = [];
    for (let i = 0; i < tweening.length; i++) {
        const t = tweening[i];
        const phase = Math.min(1, (now - t.start) / t.time);

        t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
        if (t.change) t.change(t);
        if (phase === 1) {
            t.object[t.property] = t.target;
            if (t.complete) t.complete(t);
            remove.push(t);
        }
    }
    for (let i = 0; i < remove.length; i++) {
        tweening.splice(tweening.indexOf(remove[i]), 1);
    }
});

const lerp = (a1: number, a2: number, t: number) => a1 * (1 - t) + a2 * t;

const backout = (amount: number) => (t: number) => --t * t * ((amount + 1) * t + amount) + 1;

interface MachineResult {
    reels: string[][];
    win: number;
}
