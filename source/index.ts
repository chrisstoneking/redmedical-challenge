import * as crypto from 'crypto';
import * as fs from 'fs';
import * as https from 'https';
//import * as zlib from 'zlib';
//import * as decompress from 'decompress';

console.log("Here we go!");
// Task 1
let rawKey: Buffer = fs.readFileSync('secret.key');
let initVector: Buffer = fs.readFileSync('iv.txt')
let authTag: Buffer = fs.readFileSync('auth.txt')

let securityKey = rawKey.slice(0,32);

// Read encrypted file and decrypt it
let encryptedData = fs.readFileSync('secret.enc');

const decipher = crypto.createDecipheriv('aes-256-gcm', securityKey, initVector);
decipher.setAuthTag(authTag);

let decryptedData = Buffer.concat([decipher.update(encryptedData) , decipher.final()]);

// Unfortunately, I couldn't work out how exactly the decrypted data was compressed
// Tried several modules, such as zlib and decompress, tried gzip and TAR - no luck!
// So for remaining tasks, I used the given text file

// Task 2 and 3
let fileContent = fs.readFileSync('clear_smaller.txt').toString();

const sumOfDigits = getSumOfDigits(fileContent);
const sumOfDigitsAndVowels = getSumOfDigitsAndVowels(fileContent);

console.log(`Sum of digits is ${sumOfDigits}`);
console.log(`Sum of digits and vowels is ${sumOfDigitsAndVowels}`);

// Task 4a
// First, split text by sentence
const sentences = fileContent.replace(/([.?!])\s*(?=[A-Za-z0-9])/g, "$1|").split("|");

// Next, determine sums of numbers in each sentence
const sums: number[] = [];
sentences.forEach(sentence => sums.push(getSumOfDigits(sentence)));

// Get the top ten, first make a copy of the array
// because it will be mutated and we need the unsorted array later
const sortedArray = Array.from(sums);
sortedArray.sort((n1,n2) => n2 - n1);
let topTen: number[] = sortedArray.slice(0, 10);
console.log(`Top ten values: ${topTen}`);

// Then get the top ten in order of appearance
const topTenInOrderOfAppearance: number[] = [];
sums.forEach(sum => {
    if (topTen.includes(sum)) {
        topTenInOrderOfAppearance.push(sum);
        const ttIndex = topTen.indexOf(sum);
        topTen.splice(ttIndex, 1);
    }
})

console.log(`Top ten values in order of appearance: ${topTenInOrderOfAppearance}`);

// Next, subtract their indexes
const topTenInOrderOfAppearanceMinusIndexes: number[] = [];
topTenInOrderOfAppearance.forEach((tt, index) => {
    const newValue = tt - index;
    topTenInOrderOfAppearanceMinusIndexes.push(newValue);
})

console.log(`Top ten values in order of appearance, minus indexes: ${topTenInOrderOfAppearanceMinusIndexes}`);

// Task 4b, convert to ASCII to get solution word
const solutionWord = String.fromCharCode(...topTenInOrderOfAppearanceMinusIndexes);

// Task 4c, start HTTPS server and return solution word
const serverOptions = {
  key: fs.readFileSync(`localhost.key`),
  cert: fs.readFileSync(`localhost.crt`)
};

https.createServer(serverOptions, (_req, res) => {
  res.writeHead(200);
  res.end(`Solution is ${solutionWord}`);
}).listen(8080)



// Functions used in Task 4
function getSumOfDigits(input: string): number {
    let result = 0;
    const chars = [...input];

    chars.forEach((c, _i) => {
        if (c >= '0' && c <= '9') {
            result += parseInt(c);
        }
    });
    return result;
}

function getSumOfDigitsAndVowels(input: string): number {
    let result = 0;
    const chars = [...input];
    const vowelMap = new Map<string, number>([
        ["a", 2],
        ["e", 4],
        ["i", 8],
        ["o", 16],
        ["u", 32]
    ]);

    chars.forEach((c, _i) => {
        if (c >= '0' && c <= '9') {
            result += parseInt(c);
        } else if (vowelMap.has(c)){
            result += vowelMap.get(c)!;
        }
    });
    return result;
}
