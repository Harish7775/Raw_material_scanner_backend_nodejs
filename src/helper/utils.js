const  formatNumber = (number) => {
    if (typeof number !== 'number') {
        throw new Error('Input must be a number');
    }
    
    if (number >= 10000000) {
        return (number / 10000000).toFixed(2) + 'Cr';
    } else if (number >= 100000) {
        return (number / 100000).toFixed(2) + 'L';
    } else {
        return number.toString();
    }
}
const getDirection = (dob) => {
    const date = new Date(dob)
    const month = date.getMonth() + 1; // Adding 1 because getMonth() returns zero-based index
    const day = date.getDate();
    let sign = "";
    let direction = "";

    switch(month) {
        case 3:
            sign = (day >= 21) ? "Aries" : "Pisces";
            direction = (day >= 21) ? "East" : "North";
            break;
        case 4:
            sign = (day <= 19) ? "Aries" : "Taurus";
            direction = (day <= 19) ? "East" : "North";
            break;
        case 5:
            sign = (day <= 20) ? "Taurus" : "Gemini";
            direction = (day <= 20) ? "North" : "West";
            break;
        case 6:
            sign = (day <= 20) ? "Gemini" : "Cancer";
            direction = (day <= 20) ? "West" : "North";
            break;
        case 7:
            sign = (day <= 22) ? "Cancer" : "Leo";
            direction = (day <= 22) ? "West" : "South";
            break;
        case 8:
            sign = (day <= 22) ? "Leo" : "Virgo";
            direction = (day <= 22) ? "South" : "West";
            break;
        case 9:
            sign = (day <= 22) ? "Virgo" : "Libra";
            direction = (day <= 22) ? "South" : "East";
            break;
        case 10:
            sign = (day <= 22) ? "Libra" : "Scorpio";
            direction = (day <= 22) ? "East" : "South";
            break;
        case 11:
            sign = (day <= 21) ? "Scorpio" : "Sagittarius";
            direction = (day <= 21) ? "East" : "South";
            break;
        case 12:
            sign = (day <= 21) ? "Sagittarius" : "Capricorn";
            direction = (day <= 21) ? "South" : "East";
            break;
        case 1:
            sign = (day <= 19) ? "Capricorn" : "Aquarius";
            direction = (day <= 19) ? "South" : "West";
            break;
        case 2:
            sign = (day <= 18) ? "Aquarius" : "Pisces";
            direction = (day <= 18) ? "West" : "North";
            break;
        default:
            sign = "Invalid date";
            direction = "";
    }

    return { sign, direction };

    
};


 
 

module.exports = {formatNumber,getDirection}