const parameters = {
    slope: 0,
    intercept: 0,
};

const trueParameters = {
    slope: 1,
    intercept: 0,
};

const maxParameters = {
    slope: 1,
    intercept: 1
}

const minParameters = {
    slope: -1,
    intercept: -1
}

// x, y coordinates of the dummy data
let dummyData = [];

function initData(p, nPoints) {
    trueParameters.intercept = p.random(minParameters.intercept, maxParameters.intercept);
    trueParameters.slope = p.random(minParameters.slope, maxParameters.slope);
    const data = [];
    for (let i = 0; i < nPoints; i++) {
        // add some normally distributed noise to the line to make it more realistic
        const x = p.random(-1, 1);
        // const y = trueSlope * x + trueIntercept + p.randomGaussian(0, 0.2);
        const y = trueParameters.slope * x + trueParameters.intercept + p.randomGaussian(0, 0.2);
        data.push({ x, y });
    }
    return data;
}

let optimizing = false;

let learningRate = 0.01;

function meanAbsoluteError(parameters, data) {
    let error = 0;
    for (let i = 0; i < data.length; i++) {
        const { x, y } = data[i];
        error += Math.abs(parameters.slope * x + parameters.intercept - y);
    }
    return error / data.length;
}

function meanSquaredError(parameters, data) {
    let error = 0;
    for (let i = 0; i < data.length; i++) {
        const { x, y } = data[i];
        error += Math.pow(parameters.slope * x + parameters.intercept - y, 2);
    }
    return error / data.length;
}

function huberLoss(parameters, data) {
    let error = 0;
    for (let i = 0; i < data.length; i++) {
        const { x, y } = data[i];
        const diff = parameters.slope * x + parameters.intercept - y;
        if (Math.abs(diff) < 1) {
            error += Math.pow(diff, 2);
        } else {
            error += 2 * Math.abs(diff) - 1;
        }
    }
    return error / data.length;
}

let errorFunction = meanAbsoluteError;

function aproxGradient(parameters, data, errorFunction) {
    const epsilon = 0.0001;
    const gradient = {
        slope: (errorFunction({ slope: parameters.slope + epsilon, intercept: parameters.intercept }, data) - errorFunction(parameters, data)) / epsilon,
        intercept: (errorFunction({ slope: parameters.slope, intercept: parameters.intercept + epsilon }, data) - errorFunction(parameters, data)) / epsilon,
    };
    return gradient;
}

let batchSizePercentage = 100;

function minibatchidx(data) {
    // get batch size percentage from id="batchSize" slider
    // const batchSizeSlider = document.getElementById("batchSize");
    // // if batchSizeSlider is empty or undefined return all indices
    // if (!batchSizeSlider || batchSizeSlider.value === 0) {
    //     return [...Array(data.length).keys()];
    // }

    const batchSize = Math.ceil(data.length * batchSizePercentage / 100);
    console.log(batchSize, data.length);
    // sample without replacement
    const possibleIdx = [...Array(data.length).keys()];
    const idx = [];
    for (let i = 0; i < batchSize; i++) {
        const randomIdx = Math.floor(Math.random() * possibleIdx.length);
        idx.push(possibleIdx[randomIdx]);
        possibleIdx.splice(randomIdx, 1);
    }
    return idx;
}


let currentMinibatchIdx = minibatchidx(dummyData);


function minibatch(data) {
    // if currentMinibatchIdx is empty or undefined return the whole data
    if (!currentMinibatchIdx || currentMinibatchIdx.length === 0) {
        return data;
    }

    const batch = [];
    for (let i = 0; i < currentMinibatchIdx.length; i++) {
        batch.push(data[currentMinibatchIdx[i]]);
    }
    return batch;
}


let updateRate = 1;


function drawArrow(p, base, vec, myColor) {
    p.push();
    p.stroke(myColor);
    p.strokeWeight(2);
    p.fill(myColor);
    p.translate(base.x, base.y);
    p.line(0, 0, vec.x, vec.y);
    p.rotate(vec.heading());
    let arrowSize = 1;
    p.translate(vec.mag() - arrowSize, 0);
    p.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
    p.pop();
}


const colorMatrix = [];

const parameterSpaceSketch = (p) => {
    p.setup = () => {
        var canvasDiv = document.getElementById('parameterSpace');
        var width = canvasDiv.offsetWidth;
        p.createCanvas(width,width);

        // set frame rate to 30
        p.frameRate(30);
    }

    p.draw = () => {
        const updateFrame = p.frameCount % updateRate === 0;

        if (updateFrame) {
            currentMinibatchIdx = minibatchidx(dummyData);
        }

        // lossToggle checkbox value
        const lossToggle = document.getElementById('lossToggle').checked;
        const gradientToggle = document.getElementById('gradientToggle').checked;

        const selectedLossFunction = document.getElementById('lossFunction').value;

        if (selectedLossFunction === 'mae') {
            errorFunction = meanAbsoluteError;
        } else if (selectedLossFunction === 'mse') {
            errorFunction = meanSquaredError;
        } else if (selectedLossFunction === 'huber') {
            errorFunction = huberLoss;
        }

        if (lossToggle) {

            // draw a grid of squares color coded by their error
            const nSquares = 50;
            const squareSize = p.width / nSquares;

            p.colorMode(p.HSB, 100);
            const errors = [];

            let maxError = -Infinity;
            let minError = Infinity;

            for (let i = 0; i < nSquares; i++) {
                errors.push([]);
                for (let j = 0; j < nSquares; j++) {
                    const slope = p.map(i, 0, nSquares, minParameters.slope, maxParameters.slope);
                    const intercept = p.map(j, 0, nSquares, maxParameters.intercept, minParameters.intercept);
                    const error = errorFunction({ slope, intercept }, minibatch(dummyData));
                    errors[i].push(error);
                    maxError = Math.max(maxError, error);
                    minError = Math.min(minError, error);
                }
            }

            p.strokeWeight(2);
            for (let i = 0; i < nSquares; i++) {
                for (let j = 0; j < nSquares; j++) {
                    const error = errors[i][j];
                    let color = p.map(error, minError, maxError, 85, 0);
                    p.fill(color, 100, 100);
                    p.stroke(color, 100, 100);
                    p.rect(i * squareSize, j * squareSize, squareSize, squareSize);
                }
            }
            p.colorMode(p.RGB, 255);
        } else {
            p.background(255);
        }

        if (gradientToggle) {
            const nSquares = 25;
            const squareSize = p.width / nSquares;
            p.colorMode(p.HSB, 100);
            for (let i = 0; i < nSquares; i++) {
                for (let j = 0; j < nSquares; j++) {
                    const slope = p.map(i, 0, nSquares, minParameters.slope, maxParameters.slope);
                    const intercept = p.map(j, 0, nSquares, maxParameters.intercept, minParameters.intercept);
                    const gradient = aproxGradient({ slope, intercept }, minibatch(dummyData), errorFunction);
                    const gradientVector = p.createVector(gradient.slope, -gradient.intercept);
                    const squareCenter = p.createVector(i * squareSize + squareSize / 2, j * squareSize + squareSize / 2);
                    drawArrow(p, squareCenter, gradientVector.mult(10), p.color(0, 0, 0));
                }
            }
            p.colorMode(p.RGB, 255);
        }


        // if the mouse is pressed, update the parameters
        if (p.mouseIsPressed) {
            // if mouse is on the canvas, update the parameters
            if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
                optimizing = false;
                parameters.slope = p.map(p.mouseX, 0, p.width, minParameters.slope, maxParameters.slope);
                parameters.intercept = p.map(p.mouseY, 0, p.height, maxParameters.intercept, minParameters.intercept);
            }
        }

        // if there is no data, don't optimize
        if (dummyData.length === 0) {
            optimizing = false;
        }

        if (optimizing && updateFrame) {
            const gradient = aproxGradient(parameters, minibatch(dummyData), errorFunction);
            parameters.slope -= gradient.slope * learningRate;
            parameters.intercept -= gradient.intercept * learningRate;
            // if the parameters are out of bounds, set them to the bounds
            if (parameters.slope < minParameters.slope) {
                parameters.slope = minParameters.slope;
            } else if (parameters.slope > maxParameters.slope) {
                parameters.slope = maxParameters.slope;
            }

            if (parameters.intercept < minParameters.intercept) {
                parameters.intercept = minParameters.intercept;
            } else if (parameters.intercept > maxParameters.intercept) {
                parameters.intercept = maxParameters.intercept;
            }

            // if the magnitude of the gradient is less than 0.01, reset the data
            if (Math.sqrt(Math.pow(gradient.slope, 2) + Math.pow(gradient.intercept, 2)) < 0.01) {
                dummyData = initData(p, 100);
            }
        }


        // Draw a ball at the current parameter values
        p.fill(255, 0, 0);
        p.stroke(0);
        p.strokeWeight(2);
        p.ellipse(p.map(parameters.slope, minParameters.slope, maxParameters.slope, 0, p.width), p.map(parameters.intercept, maxParameters.slope, minParameters.slope, 0, p.height), 10);

        p.stroke(0);
        p.strokeWeight(4);
        // draw a border around the data space
        p.noFill();
        p.rect(0, 0, p.width, p.height);

        // display the current loss in the top left
        p.fill(255);
        p.strokeWeight(3);
        p.stroke(0);
        p.textSize(16);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`loss: ${errorFunction(parameters, minibatch(dummyData)).toFixed(2)}`, 10, 10);


    }
}

// when the clear data button with id="clearData" is clicked, clear the data



const dataSpaceSketch = (p) => {
    
    dummyData = initData(p, 100);

    p.setup = () => {
        
        var canvasDiv = document.getElementById('dataSpace');
        var width = canvasDiv.offsetWidth;
        p.createCanvas(width,width);

        // clear data button 
        document.getElementById('clearData').onclick = () => {
            dummyData = [];
        }

        // reset data button
        document.getElementById('resetData').onclick = () => {
            dummyData = initData(p, 100);
        }

        // set optimization button
        document.getElementById('optimize').onclick = () => {
            optimizing = !optimizing;
        }

        // make the learning rate slider update the learning rate
        document.getElementById('learningRate').oninput = () => {
            learningRate = document.getElementById('learningRate').value;
            // set learning rate to be 10^(-learningRate)
            learningRate = Math.pow(10, learningRate);
            // update the learning rate label to show the new value
            document.getElementById('learningRateLabel').innerHTML = `Learning Rate: ${learningRate.toFixed(4)}`;
        }

        // make the batch size slider update the batch size
        document.getElementById('batchSize').oninput = () => {
            batchSizePercentage = document.getElementById('batchSize').value;
            // update the batch size label to show the new value
            document.getElementById('batchSizeLabel').innerHTML = `Batch Size (percentage): ${batchSizePercentage}%`;
        }

        // make the update rate slider update the update rate
        document.getElementById('updateRate').oninput = () => {
            updateRate = document.getElementById('updateRate').value;
            // update the update rate label to show the new value
            document.getElementById('updateRateLabel').innerHTML = `Update every ${updateRate} frame(s)`;
        }
    }

    p.draw = () => {
        p.background(255);
        
        p.stroke(0);
        p.strokeWeight(4);
        // draw a border around the data space
        p.noFill();
        p.rect(0, 0, p.width, p.height);

        // draw axis at 0, 0
        p.stroke(0);
        p.strokeWeight(2);
        p.line(0, p.height / 2, p.width, p.height / 2);
        p.line(p.width / 2, 0, p.width / 2, p.height);

        // draw the dummy data
        p.stroke(0);
        p.strokeWeight(4);
        for (let i = 0; i < dummyData.length; i++) {
            const { x, y } = dummyData[i];
            // p.point(p.map(x, -1, 1, 0, p.width), p.map(y, -1, 1, p.height, 0));
            // use maxParameters and minParameters to map the data to the canvas
            p.point(p.map(x, minParameters.slope, maxParameters.slope, 0, p.width), p.map(y, maxParameters.intercept, minParameters.intercept, 0, p.height));
        }
        // draw the current minibatch if the batch size is less than 100%
        if (batchSizePercentage < 100) {
            p.stroke(255, 0, 0);
            p.strokeWeight(3);
            p.fill(0);
            const batch = minibatch(dummyData);
            for (let i = 0; i < batch.length; i++) {
                const { x, y } = batch[i];
                p.ellipse(
                    p.map(x, minParameters.slope, maxParameters.slope, 0, p.width),
                    p.map(y, maxParameters.intercept, minParameters.intercept, 0, p.height),
                    6,
                    6
                );
            }
        }

        // draw the line defined by the parameters
        p.stroke(255, 0, 0);
        p.strokeWeight(2);
        p.line(
            p.map(-1, -1, 1, 0, p.width),
            p.map(parameters.slope * -1 + parameters.intercept, maxParameters.intercept, minParameters.intercept, 0, p.height),
            
            p.map(1, -1, 1, 0, p.width),
            p.map(parameters.slope * 1 + parameters.intercept, maxParameters.intercept, minParameters.intercept, 0, p.height)
        );

        // write the eqation of the line in the top left corner
        p.fill(255, 0, 0);
        p.stroke(255);
        p.strokeWeight(2);
        p.textSize(16);
        p.text(`y = ${parameters.slope.toFixed(2)}x + ${parameters.intercept.toFixed(2)}`, 10, 20);

    }

    // when the mouse is clicked add a new point to the data
    p.mouseClicked = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            const x = p.map(p.mouseX, 0, p.width, minParameters.slope, maxParameters.slope);
            const y = p.map(p.mouseY, 0, p.height, maxParameters.intercept, minParameters.intercept);
            dummyData.push({ x, y });
        }
    }
}


const parameterSpace = new p5(parameterSpaceSketch, 'parameterSpace');
const dataSpace = new p5(dataSpaceSketch, 'dataSpace');