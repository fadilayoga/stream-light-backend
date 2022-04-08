let moment = require('moment')

module.exports = {
    getTime() {
        let now = moment('2022-02-25T08:47:27.501+00:00').format('DMYY:Hms');
        return now
    },
    getDiff(lastUpdate) {
        let past = moment('25/2/22 15:36:0', "D/M/YY H:m:s");
        let now = moment();
        return past.diff(now, 'seconds')
    }
}