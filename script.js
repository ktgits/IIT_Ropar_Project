let svg;
let nodes = [];
let edges = [];
let shortestPath = [];

// Function to generate a random graph
function generateRandomGraph() {
    // Clear previous graph
    d3.select("#graph-svg").selectAll("*").remove();

    // Initialize SVG container
    const width = 800, height = 600;
    svg = d3.select("#graph-svg")
            .attr("width", width)
            .attr("height", height);

    // Parse nodes input
    const nodesInput = document.getElementById("nodes-input").value.trim();
    if (!nodesInput) {
        alert("Please enter nodes (e.g., A, B, C)");
        return;
    }

    // Extract node labels
    const nodeLabels = nodesInput.split(",").map(label => label.trim());
    nodes = nodeLabels.map((label, index) => ({
        id: label,
        label: label,
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 100) + 50
    }));

    // Draw nodes
    svg.selectAll(".node")
       .data(nodes)
       .enter()
       .append("circle")
       .attr("class", "node")
       .attr("r", 20)
       .attr("cx", d => d.x)
       .attr("cy", d => d.y)
       .append("title")
       .text(d => d.label);

    svg.selectAll(".node-label")
       .data(nodes)
       .enter()
       .append("text")
       .attr("class", "node-label")
       .attr("x", d => d.x)
       .attr("y", d => d.y)
       .attr("dy", -25)
       .attr("text-anchor", "middle")
       .attr("font-size", "14px")
       .attr("fill", "#333")
       .text(d => d.label);

    // Parse edges input
    const edgesInput = document.getElementById("edges-input").value.trim();
    if (!edgesInput) {
        alert("Please enter edges in the format 'A-B 2, B-C 3'");
        return;
    }

    edges = [];
    const edgesList = edgesInput.split(",");
    let edgeId = 0;

    edgesList.forEach(edgeStr => {
        const [nodePair, weight] = edgeStr.trim().split(" ");
        const [nodeA, nodeB] = nodePair.split("-");

        const sourceNode = nodes.find(node => node.label === nodeA);
        const targetNode = nodes.find(node => node.label === nodeB);

        if (sourceNode && targetNode) {
            edges.push({
                id: edgeId++,
                source: sourceNode,
                target: targetNode,
                weight: parseInt(weight)
            });
        }
    });

    // Draw edges with labels
    svg.selectAll(".link")
       .data(edges)
       .enter()
       .append("line")
       .attr("class", "link")
       .attr("x1", d => d.source.x)
       .attr("y1", d => d.source.y)
       .attr("x2", d => d.target.x)
       .attr("y2", d => d.target.y)
       .attr("stroke", "#999")
       .attr("stroke-opacity", 0.6)
       .attr("stroke-width", d => Math.sqrt(d.weight));

    svg.selectAll(".link-label")
       .data(edges)
       .enter()
       .append("text")
       .attr("class", "link-label")
       .attr("x", d => (d.source.x + d.target.x) / 2)
       .attr("y", d => (d.source.y + d.target.y) / 2)
       .attr("dy", -5)
       .attr("text-anchor", "middle")
       .attr("font-size", "12px")
       .attr("fill", "#333")
       .text(d => d.weight);
}

// Dijkstra's algorithm to find the shortest path
function findShortestPath() {
    const startNodeLabel = document.getElementById("start-node").value.trim();
    const endNodeLabel = document.getElementById("end-node").value.trim();

    const startNode = nodes.find(node => node.label === startNodeLabel);
    const endNode = nodes.find(node => node.label === endNodeLabel);

    if (!startNode || !endNode) {
        return; // Do not alert; simply return
    }

    const distances = {};
    const previousNodes = {};
    const queue = new PriorityQueue((a, b) => a.distance - b.distance);

    nodes.forEach(node => {
        distances[node.label] = Infinity;
        previousNodes[node.label] = null;
    });
    distances[startNode.label] = 0;
    queue.enqueue({ node: startNode, distance: 0 });

    while (!queue.isEmpty()) {
        const { node: currentNode } = queue.dequeue();

        if (currentNode === endNode) {
            break; // Reached the destination node
        }

        edges.forEach(edge => {
            if (edge.source === currentNode || edge.target === currentNode) {
                const neighbor = edge.source === currentNode ? edge.target : edge.source;
                const newDistance = distances[currentNode.label] + edge.weight;

                if (newDistance < distances[neighbor.label]) {
                    distances[neighbor.label] = newDistance;
                    previousNodes[neighbor.label] = currentNode;
                    queue.enqueue({ node: neighbor, distance: newDistance });
                }
            }
        });
    }

    shortestPath = [];
    let currentNode = endNode;
    while (currentNode) {
        shortestPath.unshift(currentNode);
        currentNode = previousNodes[currentNode.label];
    }

    highlightShortestPath(); // Call the highlight function
}

// Function to highlight the shortest path
function highlightShortestPath() {
    if (shortestPath.length === 0) {
        return;
    }

    // Highlight edges in the shortest path
    for (let i = 0; i < shortestPath.length - 1; i++) {
        const sourceNode = shortestPath[i];
        const targetNode = shortestPath[i + 1];

        svg.append("line")
           .attr("class", "highlight")
           .attr("x1", sourceNode.x)
           .attr("y1", sourceNode.y)
           .attr("x2", targetNode.x)
           .attr("y2", targetNode.y)
           .attr("stroke", "#1aa4bd") // Highlight color
           .attr("stroke-width", 4)
           .attr("stroke-opacity", 1);
    }

    // Highlight nodes on the shortest path
    shortestPath.forEach(node => {
        svg.selectAll(".node")
           .filter(d => d.label === node.label)
           .transition()
           .duration(500)
           .attr("r", 25) // Increased radius for highlight
           .transition()
           .duration(500)
           .attr("r", 20); // Return to original size
    });
}

// Priority Queue Class
class PriorityQueue {
    constructor(compare) {
        this.compare = compare;
        this.heap = [];
    }

    enqueue(item) {
        this.heap.push(item);
        this._siftUp();
    }

    dequeue() {
        const first = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this._siftDown();
        }
        return first;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    _siftUp() {
        let nodeIndex = this.heap.length - 1;
        while (nodeIndex > 0) {
            const parentIndex = Math.floor((nodeIndex - 1) / 2);
            if (this.compare(this.heap[nodeIndex], this.heap[parentIndex]) >= 0) {
                break;
            }
            [this.heap[nodeIndex], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[nodeIndex]];
            nodeIndex = parentIndex;
        }
    }

    _siftDown() {
        let nodeIndex = 0;
        const length = this.heap.length;
        const element = this.heap[nodeIndex];

        while (true) {
            const leftChildIndex = 2 * nodeIndex + 1;
            const rightChildIndex = 2 * nodeIndex + 2;
            let swapIndex = null;

            if (leftChildIndex < length) {
                if (this.compare(this.heap[leftChildIndex], element) < 0) {
                    swapIndex = leftChildIndex;
                }
            }

            if (rightChildIndex < length) {
                if (this.compare(this.heap[rightChildIndex], (swapIndex === null ? element : this.heap[leftChildIndex])) < 0) {
                    swapIndex = rightChildIndex;
                }
            }

            if (swapIndex === null) break;

            [this.heap[nodeIndex], this.heap[swapIndex]] = [this.heap[swapIndex], this.heap[nodeIndex]];
            nodeIndex = swapIndex;
        }
    }
}
