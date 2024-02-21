const { getAuthenticatedGmail } = require("./utils/gmail");

const tets = async () => { 
    try {
        const authenticatedGmail = await getAuthenticatedGmail("sattvamuser@gmail.com");

        console.log("authenticatedGmail ===>", authenticatedGmail);

    } catch (error) {
        // console.log("error while processing mail", error);
        throw error;
    }
}

tets();