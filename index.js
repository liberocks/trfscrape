import 'dotenv/config'

import fs from 'fs';
import fetch from 'node-fetch';
import zlib from 'zlib';
import moment from 'moment';

const DUMP_DIR = './dump'

const cities = [{
        name: 'jakarta',
        transportationTypes: ['bus', 'train', 'transjakarta', 'mediumbus', 'angkot']
    }, {
        name: 'rio',
        transportationTypes: ['metrotrains', 'bus', 'brt', 'touristic', 'ferry', 'minibus', 'tram'],
    }, {
        name: 'saopaulo',
        transportationTypes: ['metro', 'bus', 'emtu', 'ferry', 'touristic', '']
    }, {
        name: 'riga',
        transportationTypes: ['tram', 'trolleybus', 'bus', 'minibus']
    }, {
        name: 'tallinn',
        transportationTypes: ['tram', 'trolleybus', 'bus', 'regionalbus', 'train']
    }, {
        name: 'kaunas',
        transportationTypes: ['trolleybus', 'bus', 'minibus', 'districtbus']
    },
    {
        name: 'klaipeda',
        transportationTypes: ['bus', 'minibus', 'ferry', 'districtbus']
    }, {
        name: 'panevezys',
        transportationTypes: ['bus', 'districtbus']
    }, {
        name: 'siauliai',
        transportationTypes: ['bus']
    }, {
        name: 'vilnius',
        transportationTypes: ['trolleybus', 'bus']
    }, {
        name: 'ankara',
        transportationTypes: ['metro', 'train', 'gondola', 'bus']
    }, {
        name: 'bursa',
        transportationTypes: ['metro', 'tram', 'bus']
    }, {
        name: 'istanbul',
        transportationTypes: ['metro', 'tram', 'metrobus', 'bus', 'ferry', 'minibus']
    }, {
        name: 'izmir',
        transportationTypes: ['metro', 'bus', 'ferry', 'tram']
    }
]

const sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const fetchScheduleDetail = async(city, type, lineId) => {
    const directoryPath = `${DUMP_DIR}/${city.name}/${type}`
    fs.mkdirSync(directoryPath, { recursive: true });
    const filename = `${directoryPath}/${lineId}.json`

    if (!fs.existsSync(filename)) {
        const url = `${process.env.BASE_URL}/${city.name}/schedule?scheduleId=${lineId}&transportType=${type}`
        const result = await fetch(url);

        let data = ''
        if (result.headers['content-encoding'] === 'gzip') {
            data = await zlib.gunzipSync(result.body)
        } else {
            data = await result.json()
        }


        fs.writeFileSync(filename, JSON.stringify(data, null, 4));

        return data
    } else {
        return JSON.parse(fs.readFileSync(filename, 'utf8'))
    }
}

const fetchScheduleOutline = async(city, type) => {
    const directoryPath = `${DUMP_DIR}/${city.name}/${type}`
    fs.mkdirSync(directoryPath, { recursive: true });
    const filename = `${directoryPath}/outline.json`

    if (!fs.existsSync(filename)) {

        const url = `${process.env.BASE_URL}/${city.name}/all?transportType=${type}`
        const result = await fetch(url);

        let data = ''
        if (result.headers['content-encoding'] === 'gzip') {
            data = await zlib.gunzipSync(result.body)
        } else {
            data = await result.json()
        }

        fs.writeFileSync(filename, JSON.stringify(data, null, 4));

        return data
    } else {
        return JSON.parse(fs.readFileSync(filename, 'utf8'))
    }
}




const run = async() => {
    for (const city of cities) {
        for (const type of city.transportationTypes) {
            console.log(`[${moment().format('HH:mm:ss')}] Processing ${city.name}>${type}`)
            const outline = await fetchScheduleOutline(city.name, type);

            for (const transport of outline.schedulesByTransportId) {
                console.log(`[${moment().format('HH:mm:ss')}] Processing ${city.name}>${type}>${transport.transportName}`)
                for (const schedule of transport.schedules) {
                    try {
                        console.log(`[${moment().format('HH:mm:ss')}] Processing ${city.name}>${type}>${transport.transportName}>${schedule.scheduleId}`)
                        await fetchScheduleDetail(city.name, type, schedule.scheduleId);
                        await sleep(Math.ceil(Math.random() * 1e4) + 2000)
                    } catch (e) {
                        console.log(`[${moment().format('HH:mm:ss')}] Error on ${city.name}>${type}>${transport.transportName}>${schedule.scheduleId} : ${e.message}`, e)
                    }
                }
            }
        }
    }


}

run()