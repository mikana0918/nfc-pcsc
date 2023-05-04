"use strict";

// #############
// Example: Basic usage
// - see "Basic usage" section in README for an explanation
// #############

import { NFC } from '../src/index';
import pretty from './pretty-logger';

const nfc = new NFC(); // optionally you can pass logger

const READ_BINARY = 0xB0
const SELECT_FILE = 0xA4
// available apdu commands
const COMMANDS = {
	idm: Buffer.from([0xFF, 0xCA, 0x00, 0x00]),
	pmm: Buffer.from([0xFF, 0xCA, 0x01, 0x00]),
}

nfc.on('reader', reader => {

	console.log(reader)
	console.log(`${reader.reader.name}  device attached`);

	// enable when you want to auto-process ISO 14443-4 tags (standard=TAG_ISO_14443_4)
	// when an ISO 14443-4 is detected, SELECT FILE command with the AID is issued
	// the response is available as card.data in the card event
	// you can set reader.aid to:
	// 1. a HEX string (which will be parsed automatically to Buffer)
	reader.aid = 'F222222222';
	// 2. an instance of Buffer containing the AID bytes
	// reader.aid = Buffer.from('F222222222', 'hex');
	// 3. a function which must return an instance of a Buffer when invoked with card object (containing standard and atr)
	//    the function may generate AIDs dynamically based on the detected card
	// reader.aid = ({ standard, atr }) => {
	//
	// 	return Buffer.from('F222222222', 'hex');
	//
	// };

	reader.on('card', async card => {

		// card is object containing following data
		// [always] String type: TAG_ISO_14443_3 (standard nfc tags like MIFARE) or TAG_ISO_14443_4 (Android HCE and others)
		// [always] String standard: same as type
		// [only TAG_ISO_14443_3] String uid: tag uid
		// [only TAG_ISO_14443_4] Buffer data: raw data from select APDU response

		console.log(`${reader.reader.name}  card detected`, card);

		const IDm = await reader.transmit(COMMANDS.idm, 16)
		pretty.info(`data read: IDm`, IDm);

		const PMm = await reader.transmit(COMMANDS.pmm, 16)
		pretty.info(`data read: PMm`, PMm);


		await reader.transmit(Buffer.from([0xFF,0xA4,0x00,0x01,0x02,0x0F,0x09]), 256)

		const a = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F,0x10,0x11,0x12,0x13, 0x14].map(async (hex, idx) => {
			const d = await reader.transmit(Buffer.from([0xFF, READ_BINARY,0x00,hex,0x00]), 256)
			pretty.info(`data read: d${idx}`, d);

			
			// pretty.info(d[0].toString(16).padStart(2, '0'))
			// pretty.info(d[1].toString(16).padStart(2, '0'))
			// pretty.info(d[2].toString(16).padStart(2, '0'))
			// pretty.info(d[3].toString(16).padStart(2, '0'))
			// pretty.info(d[4].toString(16).padStart(2, '0'))
			// pretty.info(d[5].toString(16).padStart(2, '0'))
			// pretty.info(d[6].toString(16).padStart(2, '0'))
			// pretty.info(d[7].toString(16).padStart(2, '0'))
			// pretty.info(d[8].toString(16).padStart(2, '0'))
			// pretty.info(d[9].toString(16).padStart(2, '0'))
			// pretty.info(d[10].toString(16).padStart(2, '0'))
			// pretty.info(d[11].toString(16).padStart(2, '0'))
			// pretty.info(d[12].toString(16).padStart(2, '0'))
			// pretty.info(d[13].toString(16).padStart(2, '0'))
			// pretty.info(d[14].toString(16).padStart(2, '0'))
			// pretty.info(d[15].toString(16).padStart(2, '0'))

			const amount = parseInt(`${d[11].toString(16).padStart(2, '0')}${d[10].toString(16).padStart(2, '0')}`, 16)
			
			console.log("残高：", amount)
		})
	});

	reader.on('card.off', card => {
		pretty.log(`${reader.reader.name}  card removed`, card);
	});

	reader.on('error', err => {
		pretty.log(`${reader.reader.name}  an error occurred`, err);
	});

	reader.on('end', () => {
		pretty.log(`${reader.reader.name}  device removed`);
	});

});

nfc.on('error', err => {
	pretty.log('an error occurred', err);
});
