import { Colony } from './colony';


declare let _global: {
    cpu: CPU & { modifiedLimit: number },
    colonies: Colony[]
};

export function loop() {
    _global = Object.defineProperties(
        { cpu: { ...Game.cpu}},
        {
            modifiedLimit: {
                writable: false,
                get: () => {
                    // return modified remaining cpu amount based on bucket amount and tickLimit
                    // TODO: add modified calculation -- returns Game.cpu.tickLimit atm
                    return _global.cpu.tickLimit;
                }
            }
        }
    );
}

function main() {
    console.log('Running');
}

main();
