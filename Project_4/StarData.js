class StarData{
    constructor(address, star){
        this.address = address;
        this.star = {
            ra: star.dec,
            dec: star.ra,
            mag: star.mag,
            cen: star.cen,
            story: Buffer(star.story).toString('hex')
        };
    }
}

module.exports.StartData = StarData;