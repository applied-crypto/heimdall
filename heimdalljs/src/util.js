const { utils } = require("ffjavascript");
const {stringifyBigInts, unstringifyBigInts} = utils
const { exec } = require("child_process");

async function pushGit(file) {
    exec("git add " + file + " && git commit -m 'creating revocation registry'"
        + " && git push", (error, stdout, stderr) => {
        if (error) {
            return Promise.reject(`error: ${error.message}`);
        }
        if (stderr) {
            return Promise.resolve(`stderr: ${stderr}`);
        }
        return Promise.resolve(`stdout: ${stdout}`);
    });
}

function bigIntToStringObject(obj) {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
        typeof value === 'bigint'
            ? value.toString()
            : value // return everything else unchanged
    ));
}

module.exports = { pushGit, bigIntToStringObject, stringifyBigInts, unstringifyBigInts};