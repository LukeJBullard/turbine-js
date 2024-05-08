/*
    Utilities for contacting the turbine
*/

var __turbine_Mersenne = new MersenneTwister19937();

//waits for whatever information is in queue to reach the turbine
function turbineWaitForReady()
{
    //600ms for latency, in space adjust this
    var delay = 600;
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, delay);
    });
}

//queries the turbine for information
function turbineQuery(min=1, max=2, certainty=4, delay=100)
{
    if (min >= max || certainty < 1 || delay < 0)
    {
        throw new Error("turbineQuery: Arguments invalid");
    }
    
    var buckets = [];
    var bucketCount = max-min+1;
    for (let i=0;i<bucketCount;i++){
        buckets[i] = 0;
    }

    function runBucket()
    {
        //get the current time in ms and make an array with each
        //decimal number of the time in each array slot
        let dateString = (new Date()).getTime().toString();
        let initArray = Array(dateString.length);
        for (let i=0;i<dateString.length;i++)
        {
            initArray[i] = parseInt(dateString[i]);
        }
        __turbine_Mersenne.init_by_array(initArray, initArray.length);

        //figure out which bucket the corresponding mersenne output belongs to
        mersenneResult = __turbine_Mersenne.genrand_real1();
        var bucketNumber = 0;
        for (let i=1/bucketCount;i<=1;i+=1/bucketCount)
        {
            if (mersenneResult <= i)
            {
                buckets[bucketNumber]++;
                if (buckets[bucketNumber] >= certainty)
                {
                    return bucketNumber;
                }
                return -1;
            }
            bucketNumber++;
        }

        //this is the case where the twister is in the 0.999... and the for loop didn't catch it
        bucketNumber = bucketCount-1;
        buckets[bucketNumber]++;
        if (buckets[bucketNumber] >= certainty)
        {
            return bucketNumber;
        }
        return -1;
    }

    return new Promise((resolve, reject) => {
        var loop = () => {
            //yield for the turbine
            turbineYield();

            //delay {delay} ms then
            setTimeout(() => {
                //add to a bucket via mersenne
                let foundBucket = runBucket();

                //if the bucket was filled then resolve which number
                if (foundBucket > -1)
                    return resolve(foundBucket+min); //add min since the buckets are 0 aligned yet the min/max is not
                
                loop();
            }, delay);
        };
        loop();
    });
}

//determines if the turbine query failed based on response
function turbineQueryFailed(turbineQueryResponse)
{
    //turbineQuery should only return a number
    return typeof(turbineQueryResponse) === "boolean";
}

//yields to the turbine
function turbineYield()
{
    //in the case of javascript, place a post request to run a syscall
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://turbine-bs.nsa.gov");
    xhr.send("{'ping':'pong'}");
}