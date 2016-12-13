const interval = 1000;
const circumference = 301.635;
let count = 0;
let timer = null;
let time = document.querySelector('#timer text');
let circle = document.querySelector('#timer path:nth-of-type(2)');

/**
 * Get the current timer value.
 * @returns {number} count
 */
export function get() {
    return count;
}

/**
 * Set the timer to start counting down from a new value.
 * @param {number} countDown
 * @param {function} [callback]
 */
export function set(countDown, callback) {
    const total = count = countDown;

    // Clear so only one timer is running.
    clear();
    let expected = Date.now();

    const step = function () {
        // Get the timeout drift from the expected interval value.
        const now = Date.now();
        let drift = now - expected;
        // if (drift > interval) {
        //     // Account for missed steps if the delay was long.
        //     const missedSteps = Math.round(drift/interval);
        //     count -= missedSteps;
        //     expected += missedSteps * interval;
        //     drift -= missedSteps * interval;
        // }

        // Run the callback, update the view, decrement the count.
        if (callback && callback(count) === false) {
            clear();
            return;
        }
        if (count >= 0) {
            updateView(count, total);
            count--;
        }

        // Set a new expected value and set a new timeout.
        expected += interval;
        timer = setTimeout(step, Math.max(0, interval - drift));
    };
    step();
}

/**
 * Drop the timer value to a lower number if it's higher.
 * @param {number} countDown
 */
export function dropTo(countDown) {
    count = Math.min(count, countDown);
}

/**
 * Clear the timeout stopping the timer.
 */
export function clear() {
    if (timer !== null) {
        clearTimeout(timer);
        timer = null;
    }
}

/**
 * Update the timer view with the time and percentage left.
 * @param {number} count
 * @param {number} total
 */
function updateView(count, total) {
    time.textContent = count;
    circle.style.strokeDashoffset = circumference * (count / total);
}

export default {set, dropTo, clear}