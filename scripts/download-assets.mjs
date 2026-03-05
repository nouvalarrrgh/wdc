import https from 'https';
import fs from 'fs';
import path from 'path';

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
};

const setup = async () => {
    const publicDir = path.resolve('public');
    const audioDir = path.join(publicDir, 'audio');
    const lottieDir = path.join(publicDir, 'lottie');

    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
    if (!fs.existsSync(lottieDir)) fs.mkdirSync(lottieDir, { recursive: true });

    console.log('Downloading ambient sounds...');
    try {
        await downloadFile('https://upload.wikimedia.org/wikipedia/commons/4/4b/Rain_sound.ogg', path.join(audioDir, 'rain.ogg'));
        console.log('Rain sound downloaded.');

        await downloadFile('https://upload.wikimedia.org/wikipedia/commons/8/87/Coffee_Shop_Ambience.ogg', path.join(audioDir, 'cafe.ogg'));
        console.log('Cafe sound downloaded.');

        await downloadFile('https://upload.wikimedia.org/wikipedia/commons/e/ec/Tick_tack.ogg', path.join(audioDir, 'clock.ogg'));
        console.log('Clock sound downloaded.');

        // Plant growing lottie (using a simple available animation JSON fallback, or generating minimal json)
        // Actually LottieFiles URLs often 403 now, let's create a minimal JSON for lottie instead of downloading to be 100% safe.
        fs.writeFileSync(path.join(lottieDir, 'plant.json'), JSON.stringify({ "v": "5.5.2", "fr": 30, "ip": 0, "op": 60, "w": 400, "h": 400, "nm": "Growing Plant Placeholder", "ddd": 0, "assets": [], "layers": [{ "ddd": 0, "ind": 1, "ty": 4, "nm": "Plant", "sr": 1, "ks": { "o": { "a": 0, "k": 100, "ix": 11 }, "r": { "a": 0, "k": 0, "ix": 10 }, "p": { "a": 0, "k": [200, 350, 0], "ix": 2 }, "a": { "a": 0, "k": [0, 0, 0], "ix": 1 }, "s": { "a": 1, "k": [{ "i": { "x": [0.833, 0.833, 0.833], "y": [0.833, 0.833, 0.833] }, "o": { "x": [0.167, 0.167, 0.167], "y": [0.167, 0.167, 0.167] }, "t": 0, "s": [0, 0, 100] }, { "t": 60, "s": [100, 100, 100] }], "ix": 6 } }, "ao": 0, "shapes": [{ "ty": "gr", "it": [{ "d": 1, "ty": "el", "s": { "a": 0, "k": [50, 150], "ix": 2 }, "p": { "a": 0, "k": [0, -75], "ix": 3 }, "nm": "Leaf", "mn": "ADBE Vector Shape - Ellipse", "hd": false }, { "ty": "fl", "c": { "a": 0, "k": [0.2, 0.8, 0.3, 1], "ix": 4 }, "o": { "a": 0, "k": 100, "ix": 5 }, "r": 1, "bm": 0, "nm": "Fill 1", "mn": "ADBE Vector Graphic - Fill", "hd": false }, { "ty": "tr", "p": { "a": 0, "k": [0, 0], "ix": 2 }, "a": { "a": 0, "k": [0, 0], "ix": 1 }, "s": { "a": 0, "k": [100, 100], "ix": 3 }, "r": { "a": 0, "k": 0, "ix": 6 }, "o": { "a": 0, "k": 100, "ix": 7 }, "sk": { "a": 0, "k": 0, "ix": 4 }, "sa": { "a": 0, "k": 0, "ix": 5 }, "nm": "Transform" }], "nm": "Group 1", "np": 2, "cix": 2, "bm": 0, "ix": 1, "mn": "ADBE Vector Group", "hd": false }], "ip": 0, "op": 60, "st": 0, "bm": 0 }] }));
        console.log('Lottie plant placeholder written.');

    } catch (err) {
        console.error('Error downloading files:', err);
    }
};

setup();
