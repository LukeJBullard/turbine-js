/*
    Utilities for contacting the turbine
*/
import {MersenneTwister} from 'mersenne-twister'

class Turbine
{
    //pass an url that goes to nothing, this just invokes a syscall
    constructor(syscall_url = "http://localhost:63101") {
        //this.syscall_out_url = "http://turbine-bs.nsa.gov";
        this.syscall_out_url = syscall_url;
        this.mersenneTwister = MersenneTwister();
    }

    //waits for whatever information is in queue to reach the turbine
    waitForReady = function(delay=600)
    {
        //600ms for latency, in space adjust this
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, delay);
        });
    }

    //queries the turbine for information
    query = function(min=1, max=2, certainty=4, delay=100)
    {
        if (min >= max || certainty < 1 || delay < 0)
        {
            throw new RangeError("Turbine.query: Arguments invalid");
        }
        
        var buckets = [];
        var bucketCount = max-min+1;
        for (let i=0;i<bucketCount;i++){
            buckets[i] = 0;
        }

        function runBucket()
        {
            //seed the twister with the timestamp as a string
            let dateString = (new Date()).getTime().toString();
            __turbine_Mersenne.init_string(dateString);

            //find a random bucket to add to
            let bucketNumber = __turbine_Mersenne.ranged_random(0,bucketCount-1);
            buckets[bucketNumber]++;

            //if the bucket is filled, indicate its the one
            if (buckets[bucketNumber] >= certainty)
                return bucketNumber;

            return -1;
        }

        return new Promise((resolve, reject) => {
            var loop = () => {
                //yield for the turbine
                this.turbineYield();

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
    queryFailed = function(turbineQueryResponse)
    {
        //turbineQuery should only return a number
        return typeof(turbineQueryResponse) === "boolean";
    }

    //yields to the turbine
    yield = function()
    {
        //in the case of javascript, place a post request to run a syscall
        var xhr = new XMLHttpRequest();
        xhr.open("GET", this.syscall_out_url);
        xhr.send(null);
    }
}

export default Turbine;