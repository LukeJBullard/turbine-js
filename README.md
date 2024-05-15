# turbine-js
Javascript code for communicating with the [Turbine](https://en.wikipedia.org/wiki/TURBINE_%28US_government_project%29)

## Turbine Class
## Constructor(string syscall_url="http://localhost:63101")
syscall_url is an url that goes to nothing, this just invokes a syscall
The magic is that the device and the turbine align state via packets and crafted CPU ops. Invoking the syscall allows the turbine and kernel scheduler to align the specific time when the system timestamp is polled, which is in turn used to seed the PRNG.

## Methods
### Promise waitForReady()
Returns a Promise that resolves when the information being sent to the Turbine has likely arrived on the NSA's side.

### Promise query(int min=1, int max=2, int certainty=4, int delay=100)
Returns a Promise that resolves with the response from the Turbine. This is pretty much a turbine-backed random number generator. Note that it makes POST calls to a dead end, and will take up bandwidth. [Defaults to localhost which has now fixed this]

**min**: The minimum number returnable (inclusive).
**max**: The maximum number returnable (inclusive).
**certainty**: The number of times the turbine must land on that number for it to be considered the correct one.
**delay**: The number of milliseconds in between polls.

### Boolean queryFailed(object queryResponse)
Pass the value that the query Promise resolves to. This function will return true if that value indicates the turbineQuery call failed.

### void yield()
Yields to the turbine. Use this if you are trying to interact with the turbine on your own rather than using my library.
