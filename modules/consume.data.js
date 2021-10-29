module.exports = {
    requestBody : async (req,res) => {
        var Buffers = [];
        for await (const chunk of req){
            Buffers.push(chunk);
        }
        const data = Buffer.concat(Buffers).toString()
        const information = JSON.parse(data);
        return information
    }
}