import test from 'node:test';
import assert from 'node:assert/strict';
import quoteJsString from './index.js';

test('wraps a plain string in single quotes by default', () => {
	assert.equal(quoteJsString('unicorn'), '\'unicorn\'');
});

test('wraps a string in the given quote character', () => {
	assert.equal(quoteJsString('unicorn', '"'), '"unicorn"');
});

test('throws a TypeError for an unsupported quote character', () => {
	assert.throws(() => quoteJsString('unicorn', '`'), TypeError);
	assert.throws(() => quoteJsString('unicorn', ''), TypeError);
	assert.throws(() => quoteJsString('unicorn', 'ab'), TypeError);
});

test('escapes the quote character when it appears in the string', () => {
	assert.equal(quoteJsString('It\'s a test'), String.raw`'It\'s a test'`);
	assert.equal(quoteJsString('She said "hi"', '"'), String.raw`"She said \"hi\""`);
});

test('does not escape a quote character that differs from the wrapping quote', () => {
	assert.equal(quoteJsString('It\'s a test', '"'), '"It\'s a test"');
});

test('escapes backslashes', () => {
	assert.equal(quoteJsString(String.raw`C:\Users`), String.raw`'C:\\Users'`);
});

test('escapes common control characters with their short-hand escape', () => {
	assert.equal(quoteJsString('line1\nline2'), String.raw`'line1\nline2'`);
	assert.equal(quoteJsString('a\rb'), String.raw`'a\rb'`);
	assert.equal(quoteJsString('a\tb'), String.raw`'a\tb'`);
	assert.equal(quoteJsString('a\bb'), String.raw`'a\bb'`);
	assert.equal(quoteJsString('a\fb'), String.raw`'a\fb'`);
	assert.equal(quoteJsString('a\vb'), String.raw`'a\vb'`);
});

test('escapes NUL with a unicode escape to avoid octal escapes before digits', () => {
	assert.equal(quoteJsString('a\0b'), String.raw`'a\u{0}b'`);
	assert.equal(quoteJsString(`${String.fromCodePoint(0)}1`), String.raw`'\u{0}1'`);
	assert.equal(quoteJsString(`${String.fromCodePoint(0)}9`), String.raw`'\u{0}9'`);
});

// Characters built with `String.fromCodePoint()` rather than embedded directly, so the source file
// stays free of invisible control characters and line separators.
test('escapes other C0 control characters and DEL as a unicode escape', () => {
	assert.equal(quoteJsString(`a${String.fromCodePoint(1)}b`), String.raw`'a\u{1}b'`);
	assert.equal(quoteJsString(`a${String.fromCodePoint(127)}b`), String.raw`'a\u{7f}b'`);
});

test('escapes U+2028 and U+2029 line terminators', () => {
	assert.equal(quoteJsString(`a${String.fromCodePoint(8232)}b`), String.raw`'a\u{2028}b'`);
	assert.equal(quoteJsString(`a${String.fromCodePoint(8233)}b`), String.raw`'a\u{2029}b'`);
});

test('leaves other characters, including unicode, untouched', () => {
	assert.equal(quoteJsString('hello 🦄 world'), '\'hello 🦄 world\'');
});

test('escapes lone surrogates, which have no valid UTF-8 representation', () => {
	assert.equal(quoteJsString(`a${String.fromCodePoint(0xD8_00)}b`), String.raw`'a\u{d800}b'`);
	assert.equal(quoteJsString(`a${String.fromCodePoint(0xDF_FF)}b`), String.raw`'a\u{dfff}b'`);
	// A valid surrogate pair (an astral character) is left untouched.
	assert.equal(quoteJsString('a🦄b'), '\'a🦄b\'');
});

test('throws a TypeError for a non-string input', () => {
	assert.throws(() => quoteJsString(42), TypeError);
});
