// Written by Jonah Meggs 2021

let nodes = [];
let node_elements = [];
let recycled_nodes = [];
let outgoing = [];

let selected = null;
let selected2 = null;
let directed = false;
let weighted = false;
let list = false;
let waiting_for_weight = false;
let nextNode = 0;
let rendered = [];
let bfs_code = [
'void breadthFirst(Graph g, Vertex src) {',
'	int *visited = calloc(g->nV, sizeof(int));',
'	Queue q = QueueNew();',
'	QueueEnqueue(q, src);',
'	while (!QueueIsEmpty(q)) {',
'		Vertex v = QueueDequeue(q);',
'		if (visited[v]) {',
'			continue;',
'		}',
'		visited[v] = 1;',
'		printf("%d\\n", v);',
'		for (Vertex w = 0; w < g->nV; w++) {',
'			if (g->edges[v][w] && !visited[w]) {',
'				QueueEnqueue(q, w);',
'			}',
'		}',
'	}',
'	QueueFree(q);',
'	free(visited);',
'}'
];

let dfs_code = [
'void depthFirst(Graph g, Vertex src) {',
'	int *visited = calloc(g->nV, sizeof(int));',
'	Stack s = StackNew();',
'	StackPush(s, src);',
'	while (!StackIsEmpty(s)) {',
'		Vertex v = StackPop(s);',
'		if (visited[v]) {',
'			continue;',
'		}',
'		visited[v] = 1;',
'		printf("%d\\n", v);',
'		for (Vertex w = g->nV - 1; w >= 0; w--) {',
'			if (g->edges[v][w] && !visited[w]) {',
'				StackPush(s, w);',
'			}',
'		}',
'	}',
'	StackFree(s);',
'	free(visited);',
'}'
];

let dijkstra_code = [
'dist[]  // array of cost of shortest path from s',
'pred[]  // array of predecessor in shortest path from s',
'vSet    // vertices whose shortest path from s is unknown',
'dijkstraSSSP(G,source):',
'|  Input graph G, source node',
'|  initialise all dist[] to ∞',
'|  dist[source]=0',
'|  initialise all pred[] to -1',
'|  vSet=all vertices of G',
'|  while vSet ≠ ∅ do',
'|  |  find v ∈ vSet with minimum dist[v]',
'|  |  for each (v,w,weight) ∈ edges(G) do',
'|  |     relax along (v,w,weight)',
'|  |  end for',
'|  |  vSet=vSet \\ {v}',
'|  end while'
];
let bfs_lines = [];
let dfs_lines = [];
let dijkstra_lines = [];

init();

function init() {
	if (document.readyState === 'complete') {
		document.getElementById('body').addEventListener('keyup', respondToKey)
		document.getElementById('directed-button').addEventListener('click', setDirected);
		document.getElementById('undirected-button').addEventListener('click', setUndirected);
		document.getElementById('weighted-button').addEventListener('click', setWeighted);
		document.getElementById('unweighted-button').addEventListener('click', setUnweighted);
		document.getElementById('matrix-button').addEventListener('click', setMatrix);
		document.getElementById('list-button').addEventListener('click', setList);
		document.getElementById('graph-container').addEventListener('click', createNode);
		document.getElementById('weight-accept-button').addEventListener('click', acceptWeight);
		document.getElementById('weight-cancel-button').addEventListener('click', cancelWeight);
		initGraph(nextNode);
		let matrix_tbl = document.getElementById('adjacency-matrix');
		for (let i = 0; i < nextNode; i++) {
			for (let j = 0; j < nextNode; j++) {
				matrix_tbl.rows[i+1].cells[j+1].innerHTML = '-1';
				matrix_tbl.rows[i+1].cells[j+1].style.color = 'grey';
			}
		}
		document.getElementById('bfs-start').addEventListener('click', startBFS);
		document.getElementById('bfs-next').addEventListener('click', nextBFS);
		document.getElementById('bfs-next').disabled = true;
		document.getElementById('bfs-reset').addEventListener('click', resetBFS);
		document.getElementById('bfs-reset').disabled = true;
		let bfs_code_container = document.getElementById('bfs-code-container');
		bfs_code.forEach(line => {
			let p = document.createElement('p');
			p.innerHTML = line;
			bfs_lines.push(p);
			bfs_code_container.appendChild(p);
		});
		document.getElementById('dfs-start').addEventListener('click', startDFS);
		document.getElementById('dfs-next').addEventListener('click', nextDFS);
		document.getElementById('dfs-next').disabled = true;
		document.getElementById('dfs-reset').addEventListener('click', resetDFS);
		document.getElementById('dfs-reset').disabled = true;
		let dfs_code_container = document.getElementById('dfs-code-container');
		dfs_code.forEach(line => {
			let p = document.createElement('p');
			p.innerHTML = line;
			dfs_lines.push(p);
			dfs_code_container.appendChild(p);
		});
		document.getElementById('dijkstra-start').addEventListener('click', startDijkstra);
		document.getElementById('dijkstra-next').addEventListener('click', nextDijkstra);
		document.getElementById('dijkstra-next').disabled = true;
		document.getElementById('dijkstra-reset').addEventListener('click', resetDijkstra);
		document.getElementById('dijkstra-reset').disabled = true;
		let dijkstra_code_container = document.getElementById('dijkstra-code-container');
		dijkstra_code.forEach(line => {
			let p = document.createElement('p');
			p.innerHTML = line;
			dijkstra_lines.push(p);
			dijkstra_code_container.appendChild(p);
		});
		document.getElementById('bfs-button').addEventListener('click', showBFS);
		document.getElementById('dfs-button').addEventListener('click', showDFS);
		document.getElementById('dijkstra-button').addEventListener('click', showDijkstra);
		alert('Click somewhere in the middle panel to place a node! (and make edges by clicking 2 nodes consecutively!)')
		return;
	}
	setTimeout(init, 100);
}

function respondToKey(event) {
	if (waiting_for_weight) {
		if (event.keyCode === 13) acceptWeight();
		return;
	}
	if (event.keyCode === 46 || event.keyCode === 8) {
		if (bfs_running || dfs_running || dijkstra_running) {
			alert('You cant change the graph while the algo is running :( - try resetting the algo first.');
			return;
		}
		if (selected !== null) {
			deleteNode(selected);
			selected = null;
		}
	} else if (event.keyCode === 192) {
		if (bfs_running) resetBFS();
		if (dfs_running) resetDFS();
		if (dijkstra_running) resetDijkstra();
		reset();

	}
}

function getNextNodeValue() {
	// console.log("mep");
	if (recycled_nodes.length > 0) {
		return recycled_nodes.shift();
	}
	return nextNode++;
}

function getIndex(value) {
	console.log(nodes)
	let index = nodes.slice().reverse().findIndex(elem => {return elem < value});
	console.log("In Index", value, index);
	if (index === -1) index = 0;
	else index = nodes.length - index;
	// console.log(index)
	return index;
}

function insertDomMatrix(value) {
	let matrix_tbl = document.getElementById('adjacency-matrix');
	let th = document.createElement('th');
	th.innerHTML = ''+value;
	let index = getIndex(value);
	console.log(value, index);
	matrix_tbl.rows[0].cells[index].insertAdjacentElement('afterend', th);
	for (let i = 0; i < nodes.length-1; i++) {
		let td = document.createElement('td');
		td.innerHTML = '-1';
		td.style.color = 'grey';
		matrix_tbl.rows[i+1].cells[index].insertAdjacentElement('afterend', td);
	}
	let tr = document.createElement('tr');
	th = document.createElement('th');
	th.innerHTML = ''+value;
	tr.appendChild(th);
	for (let i = 0; i < nodes.length; i++) {
		let td = document.createElement('td');
		td.innerHTML = '-1';
		td.style.color = 'grey';
		tr.appendChild(td);
	}
	matrix_tbl.rows[index].insertAdjacentElement('afterend', tr);
}

function insertDomList(value) {
	let index = getIndex(value);
	let list_tbl = document.getElementById('adjacency-list');
	tr = document.createElement('tr');
	th = document.createElement('th');
	th.innerHTML = ''+value;
	let td = document.createElement('td');
	td.innerHTML = ' ';
	tr.appendChild(th);
	tr.appendChild(td);
	if (nodes.length === 1) list_tbl.appendChild(tr);
	else if (index === 0) list_tbl.rows[0].insertAdjacentElement('beforebegin', tr);
	else list_tbl.rows[index-1].insertAdjacentElement('afterend', tr);
}

function removeDomMatrix(value, index) {
	let matrix_tbl = document.getElementById('adjacency-matrix');
	let rem;
	rem = matrix_tbl.rows[0].cells[index+1];
	rem.parentNode.removeChild(rem);
	rem = matrix_tbl.rows[index+1];
	rem.parentNode.removeChild(rem);
	for (let i = 0; i < nodes.length; i++) {
		rem = matrix_tbl.rows[i+1].cells[index+1];
		rem.parentNode.removeChild(rem);
	}
}

function removeDomList(value, index) {
	let list_tbl = document.getElementById('adjacency-list');
	list_tbl.removeChild(list_tbl.rows[index]);
	for (let i = 0; i < nodes.length; i++) {
		list_tbl.rows[i].cells[1].innerHTML = list_tbl.rows[i].cells[1].innerText.replace(`-> ${value} `, '');
	}
}

function createNode(event) {
	if (bfs_running || dfs_running || dijkstra_running) {
		alert('You cant change the graph while the algo is running :( - try resetting the algo first.');
		return;
	}
	const value = getNextNodeValue();
	let n = document.createElement('div');
	n.classList.add('node');
	n.id = 'node-'+value;
	n.style.left = event.clientX-20+'px';
	n.style.top = event.clientY-20+'px';
	n.innerHTML = value;
	n.addEventListener('click', selectNode);
	document.getElementById('graph-container').appendChild(n);
	node_elements.push(n);
	node_elements.sort((a, b) => {return parseInt(a.value) - parseInt(b.value)});
	console.log(nodes);
	nodes.push(value);
	nodes.sort((a, b) => {return a - b;});
	console.log("sorted:");
	console.log(nodes);
	outgoing.splice(getIndex(value), 0, []);
	insertNode(value);
	// Update matrix
	insertDomMatrix(value);
	// Update list
	insertDomList(value);
}

function deleteNode(node) {
	const value = parseInt(node.innerHTML);
	const index = getIndex(value);
	recycled_nodes.push(value);
	recycled_nodes.sort();
	nodes.splice(index, 1);
	node_elements.splice(index, 1);
	removeNode(value, index); // remove from graph
	node.parentNode.removeChild(node);
	outgoing[index].forEach(elem => {elem.parentNode.removeChild(elem);});
	outgoing.splice(index, 1);
	outgoing.forEach(list => {
		for (let i = 0; i < list.length; i++) {
			console.log(list[i]['data-to']);
			if (list[i]['data-to'] === value) {
				list[i].parentNode.removeChild(list[i]);
				list.splice(i, 1);
				i--;
			}
		}
	});
	removeDomMatrix(value, index);
	removeDomList(value, index);
}

function selectNode(event) {
	event.stopPropagation();
	if (bfs_running || dfs_running || dijkstra_running) {
		alert('You cant change the graph while the algo is running :( - try resetting the algo first.');
		return;
	}
	if (selected == this) {
		selected.style.boxShadow = 'none';
		selected = null;
	} else if (selected == null) {
		selected = this;
		this.style.boxShadow = '0px 0px 15px 5px rgba(128, 128, 255, .75)';
	} else {
		console.log("attempting to draw");
		if (!containsEdge(parseInt(selected.innerHTML), parseInt(this.innerHTML))) {
			// console.log("HMMM");
			if (weighted) {
				// console.log("MMMM");
				selected2 = this;
				promptWeight();
				// event.stopPropagation();
				return;
			} else {
				drawLine(selected, this);
			}
		}
		selected.style.boxShadow = 'none';
		selected = null;
	}
	// event.stopPropagation();
}

function promptWeight() {
	// console.log("hello");
	document.getElementById('weight-prompt-background').style.display = 'block';
	document.getElementById('weight-value').focus();
	waiting_for_weight = true;
}

function acceptWeight() {
	let weight = parseInt(document.getElementById('weight-value').value);
	if (Number.isInteger(weight)) {
		document.getElementById('weight-value').value = '';
		document.getElementById('weight-prompt-background').style.display = 'none';
		drawLine(selected, selected2, weight);
		waiting_for_weight = false;
		selected.style.boxShadow = 'none';
		selected = null;
	}
}

function cancelWeight() {
	document.getElementById('weight-value').value = '';
	document.getElementById('weight-prompt-background').style.display = 'none';
	waiting_for_weight = false;
}

function drawLine(a, b, weight=1) {
	const graph = document.getElementById('graph-container');
	if (!directed || (directed && !containsEdge(parseInt(b.innerHTML), parseInt(a.innerHTML)))) {
		let line = document.createElement('div');
		line.classList.add('edge');
		if (weighted) {
			let w = document.createElement('div');
			w.classList.add('weight');
			w.innerHTML = weight;
			w.style.transform = `rotate(${Math.atan((a.offsetTop - b.offsetTop)/(a.offsetLeft - b.offsetLeft))*(-180)/Math.PI}deg)`;
			line.appendChild(w);
		}
		line.style.width = Math.sqrt(Math.pow(a.offsetLeft - b.offsetLeft, 2) + Math.pow(a.offsetTop - b.offsetTop, 2))+'px';
		line.style.transform = `rotate(${Math.atan((a.offsetTop - b.offsetTop)/(a.offsetLeft - b.offsetLeft))*180/Math.PI}deg)`;
		if (a.offsetLeft < b.offsetLeft) line.style.left = (parseInt(window.getComputedStyle(a, null).getPropertyValue("left").slice(0,-2))+20)+'px';
		else line.style.left = (parseInt(window.getComputedStyle(b, null).getPropertyValue("left").slice(0,-2))+20)+'px';
		if (a.offsetLeft < b.offsetLeft) line.style.top = (parseInt(window.getComputedStyle(a, null).getPropertyValue("top").slice(0,-2))+20)+'px';
		else line.style.top = (parseInt(window.getComputedStyle(b, null).getPropertyValue("top").slice(0,-2))+20)+'px';
		line['data-to'] = parseInt(b.innerHTML);
		outgoing[getIndex(parseInt(a.innerHTML))].push(line);
		graph.appendChild(line);
	}
	if (directed) {
		let arrow = document.createElement('div');
		arrow.classList.add('arrow-container');
		let left = document.createElement('div');
		left.classList.add('arrow-left');
		let right = document.createElement('div');
		right.classList.add('arrow-right');
		arrow.appendChild(left);
		arrow.appendChild(right);
		arrow.style.transformOrigin = "50% 0%";
		arrow.style.transform = `rotate(${Math.atan((a.offsetTop - b.offsetTop)/(a.offsetLeft - b.offsetLeft))*180/Math.PI+90+(b.offsetLeft<a.offsetLeft?180:0)}deg)`;
		// center of b, shifted by 20*cos(angle)
		let l = b.offsetLeft + 20-6 - 20*Math.cos(Math.atan((a.offsetTop - b.offsetTop)/(a.offsetLeft - b.offsetLeft))+(b.offsetLeft<a.offsetLeft?Math.PI:0));
		arrow.style.left = l+'px';
		let r = b.offsetTop + 20 - 20*Math.sin(Math.atan((a.offsetTop - b.offsetTop)/(a.offsetLeft - b.offsetLeft))+(b.offsetLeft<a.offsetLeft?Math.PI:0));
		arrow.style.top = r+'px';
		// console.log(l-b.offsetLeft-20, r-b.offsetTop-20);
		arrow['data-to'] = parseInt(b.innerHTML);
		outgoing[getIndex(parseInt(a.innerHTML))].push(arrow);
		graph.appendChild(arrow);
	}
	const matrix_tbl = document.getElementById('adjacency-matrix');
	const list_tbl = document.getElementById('adjacency-list');
	// console.log(tbl.rows[1].cells[1]);
	// console.log(a.value)
	insertEdge(parseInt(a.innerHTML), parseInt(b.innerHTML), directed, weight);

	matrix_tbl.rows[getIndex(parseInt(a.innerHTML))+1].cells[getIndex(parseInt(b.innerHTML))+1].innerHTML = weight; 
	matrix_tbl.rows[getIndex(parseInt(a.innerHTML))+1].cells[getIndex(parseInt(b.innerHTML))+1].style.color = 'black'; 
	list_tbl.rows[getIndex(parseInt(a.innerHTML))].cells[1].innerHTML += '-> ' + b.innerHTML + ' ';
	if (!directed) {
		matrix_tbl.rows[getIndex(parseInt(b.innerHTML))+1].cells[getIndex(parseInt(a.innerHTML))+1].innerHTML = weight;
		matrix_tbl.rows[getIndex(parseInt(b.innerHTML))+1].cells[getIndex(parseInt(a.innerHTML))+1].style.color = 'black'; 
		list_tbl.rows[getIndex(parseInt(b.innerHTML))].cells[1].innerHTML += '-> ' + a.innerHTML + ' ';
	}
}

function reset() {
	outgoing.forEach(list => {list.forEach(elem => {elem.parentNode.removeChild(elem);});});
	outgoing = [];
	node_elements.forEach(thing => {thing.parentNode.removeChild(thing);});
	node_elements = [];
	nodes = [];
	let matrix_tbl = document.getElementById('adjacency-matrix');
	let list_tbl = document.getElementById('adjacency-list');
	let inputContainer = matrix_tbl.parentNode;
	matrix_tbl.parentNode.removeChild(matrix_tbl);
	list_tbl.parentNode.removeChild(list_tbl);
	matrix_tbl = document.createElement('table');
	matrix_tbl.id = 'adjacency-matrix';
	let tr = document.createElement('tr');
	let th = document.createElement('th');
	tr.appendChild(th);
	matrix_tbl.appendChild(tr);
	inputContainer.appendChild(matrix_tbl);
	list_tbl = document.createElement('table');
	list_tbl.id = 'adjacency-list';
	inputContainer.appendChild(list_tbl);
	initGraph(0);
	nextNode = 0;

}

function setDirected(event) {
	if (bfs_running || dfs_running || dijkstra_running) {
		alert('You cant change the graph while the algo is running :( - try resetting the algo first.');
		return;
	}
	if (directed) return;
	directed = true;
	this.style.backgroundColor = 'white'
	document.getElementById('undirected-button').style.backgroundColor = '#F0F0F0';
	reset();
}

function setUndirected(event) {
	if (bfs_running || dfs_running || dijkstra_running) {
		alert('You cant change the graph while the algo is running :( - try resetting the algo first.');
		return;
	}
	if (!directed) return;
	directed = false;
	this.style.backgroundColor = 'white'
	document.getElementById('directed-button').style.backgroundColor = '#F0F0F0';
	reset();
}

function setWeighted(event) {
	if (bfs_running || dfs_running || dijkstra_running) {
		alert('You cant change the graph while the algo is running :( - try resetting the algo first.');
		return;
	}
	if (weighted) return;
	weighted = true;
	this.style.backgroundColor = 'white'
	document.getElementById('unweighted-button').style.backgroundColor = '#F0F0F0';
	reset();
}

function setUnweighted(event) {
	if (bfs_running || dfs_running || dijkstra_running) {
		alert('You cant change the graph while the algo is running :( - try resetting the algo first.');
		return;
	}
	if (!weighted) return;
	weighted = false;
	this.style.backgroundColor = 'white'
	document.getElementById('weighted-button').style.backgroundColor = '#F0F0F0';
	reset();
}

function setMatrix(event) {
	if (!list) return;
	list = false;
	this.style.backgroundColor = 'white'
	document.getElementById('list-button').style.backgroundColor = '#F0F0F0';
	// Display matrix rep
	document.getElementById('adjacency-list').style.display = 'none';
	document.getElementById('adjacency-matrix').style.display = 'block';
}

function setList(event) {
	if (list) return;
	list = true;
	this.style.backgroundColor = 'white'
	document.getElementById('matrix-button').style.backgroundColor = '#F0F0F0';
	// Display list rep
	document.getElementById('adjacency-matrix').style.display = 'none';
	document.getElementById('adjacency-list').style.display = 'block';
}

/*****************************
******************************

BFS STUFF

******************************
*****************************/

let bfs_line = 0;
let bfs_q = [];
let bfs_source = 0;
let bfs_v = -1;
let bfs_visited;
let bfs_w_index = -1;
let bfs_running = false;

function showBFS(event) {
	if (dfs_running) resetDFS();
	if (dijkstra_running) resetDijkstra();
	let dfs_button = document.getElementById('dfs-button');
	let dijkstra_button = document.getElementById('dijkstra-button');
	let dfs = document.getElementById('dfs');
	let bfs = document.getElementById('bfs');
	let dijkstra = document.getElementById('dijkstra');
	dfs_button.style.backgroundColor = '#F0F0F0';
	dijkstra_button.style.backgroundColor = '#F0F0F0';
	dfs.style.display = 'none';
	dijkstra.style.display = 'none';
	this.style.backgroundColor = 'white';
	bfs.style.display = 'flex';
}

function startBFS(event) {
	const sourceText = document.getElementById('bfs-source').value;
	if (sourceText === undefined || sourceText === '') {
		alert("Source is not a valid node :(");
		return;
	}
	bfs_source = parseInt(sourceText);
	if (bfs_source < 0 || !nodes.includes(bfs_source)) {
		alert("Source is not a valid node :(");
		return;
	}
	document.getElementById('bfs-source').disabled = true;
	document.getElementById('bfs-start').disabled = true;
	document.getElementById('bfs-next').disabled = false;
	document.getElementById('bfs-reset').disabled = false;
	bfs_line = 1;
	bfs_lines[bfs_line].style.backgroundColor = "yellow";
	bfs_visited = [];
	for (let i = 0; i < nodes.length; i++) {
		bfs_visited.push(0);
	}
	bfs_running = true;
	bfs_v = -1;
	bfs_w_index = -1;
}

function nextBFS(event) {
	bfs_lines[bfs_line].style.backgroundColor = "whitesmoke";
	if (bfs_line === 1 || bfs_line === 2 || bfs_line === 8 || bfs_line === 17) {
		bfs_line++;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 3) {
		bfs_q.push(bfs_source);
		document.getElementById('bfs-q').innerHTML += `${bfs_source}\n`;
		bfs_line++;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 4) {
		if (bfs_q.length === 0) {
			bfs_line = 17;
		} else {
			bfs_line++;
		}
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 5) {
		if (bfs_v !== -1) node_elements[getIndex(bfs_v)].style.boxShadow = '0px 0px 15px 5px rgba(255, 0, 0, .75)';
		bfs_v = bfs_q.shift();
		node_elements[getIndex(bfs_v)].style.boxShadow = '0px 0px 15px 5px rgba(0, 255, 0, .75)';
		let tmp = document.getElementById('bfs-q').innerHTML;
		const s = tmp.indexOf("\n");
		document.getElementById('bfs-q').innerHTML = tmp.slice(s+1);
		bfs_line++;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 6) {
		if (bfs_visited[getIndex(bfs_v)]) bfs_line++;
		else bfs_line += 3;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 7) {
		bfs_line = 4;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 9) {
		bfs_visited[getIndex(bfs_v)] = 1;
		bfs_line++;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 10) {
		document.getElementById('bfs-terminal').innerHTML += `${bfs_v}\n`;
		bfs_line++;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 11) {
		if (bfs_w_index === -1) bfs_w_index = 0;
		else bfs_w_index++;
		if (bfs_w_index >= nodes.length) {
			bfs_w_index = -1;
			bfs_line = 4;
		} else {
			bfs_line++;
		}
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 12) {
		if (containsEdge(bfs_v, nodes[bfs_w_index]) && !bfs_visited[bfs_w_index]) bfs_line++;
		else bfs_line--;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 13) {
		bfs_q.push(nodes[bfs_w_index]);
		document.getElementById('bfs-q').innerHTML += `${nodes[bfs_w_index]}\n`;
		node_elements[bfs_w_index].style.boxShadow = '0px 0px 15px 5px rgba(0, 0, 255, .75)';
		bfs_line = 11;
		bfs_lines[bfs_line].style.backgroundColor = "yellow";
	} else if (bfs_line === 18) {
		document.getElementById('bfs-next').disabled = true;
		document.getElementById('bfs-start').disabled = false;
	}
}

function resetBFS(event) {
	document.getElementById('bfs-source').disabled = false;
	document.getElementById('bfs-start').disabled = false;
	document.getElementById('bfs-next').disabled = true;
	document.getElementById('bfs-reset').disabled = true;
	bfs_running = false;
	bfs_lines[bfs_line].style.backgroundColor = "whitesmoke";
	for (let i = 0; i < nodes.length; i++) {
		node_elements[i].style.boxShadow = 'none';
	}
	document.getElementById('bfs-terminal').innerHTML = '';
	document.getElementById('bfs-q').innerHTML = '';
}


/*****************************
******************************

DFS STUFF

******************************
*****************************/

let dfs_line = 0;
let dfs_s = [];
let dfs_source = 0;
let dfs_v = -1;
let dfs_visited;
let dfs_w_index = nodes.length;
let dfs_running = false;

function showDFS(event) {
	if (bfs_running) resetBFS();
	if (dijkstra_running) resetDijkstra();
	let bfs_button = document.getElementById('bfs-button');
	let dijkstra_button = document.getElementById('dijkstra-button');
	let bfs = document.getElementById('bfs');
	let dfs = document.getElementById('dfs');
	let dijkstra = document.getElementById('dijkstra');
	bfs_button.style.backgroundColor = '#F0F0F0';
	dijkstra_button.style.backgroundColor = '#F0F0F0';
	bfs.style.display = 'none';
	dijkstra.style.display = 'none';
	this.style.backgroundColor = 'white';
	dfs.style.display = 'flex';
}

function startDFS(event) {
	const sourceText = document.getElementById('dfs-source').value;
	if (sourceText === undefined || sourceText === '') {
		alert("Source is not a valid node :(");
		return;
	}
	dfs_source = parseInt(sourceText);
	if (dfs_source < 0 || !nodes.includes(dfs_source)) {
		alert("Source is not a valid node :(");
		return;
	}
	document.getElementById('dfs-source').disabled = true;
	document.getElementById('dfs-start').disabled = true;
	document.getElementById('dfs-next').disabled = false;
	document.getElementById('dfs-reset').disabled = false;
	dfs_line = 1;
	dfs_lines[dfs_line].style.backgroundColor = "yellow";
	dfs_visited = [];
	for (let i = 0; i < nodes.length; i++) {
		dfs_visited.push(0);
	}
	dfs_running = true;
	dfs_v = -1;
	dfs_w_index = nodes.length;
}

function nextDFS(event) {
	dfs_lines[dfs_line].style.backgroundColor = "whitesmoke";
	if (dfs_line === 1 || dfs_line === 2 || dfs_line === 8 || dfs_line === 17) {
		dfs_line++;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 3) {
		dfs_s.push(dfs_source);
		document.getElementById('dfs-q').innerHTML += `${dfs_source}\n`;
		dfs_line++;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 4) {
		if (dfs_s.length === 0) {
			dfs_line = 17;
		} else {
			dfs_line++;
		}
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 5) {
		if (dfs_v !== -1) node_elements[getIndex(dfs_v)].style.boxShadow = '0px 0px 15px 5px rgba(255, 0, 0, .75)';
		dfs_v = dfs_s.pop();
		node_elements[getIndex(dfs_v)].style.boxShadow = '0px 0px 15px 5px rgba(0, 255, 0, .75)';
		let tmp = document.getElementById('dfs-q').innerHTML;
		const s = tmp.slice(0,-1).lastIndexOf("\n");
		document.getElementById('dfs-q').innerHTML = tmp.slice(0,(s===-1?0:s+1));
		dfs_line++;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 6) {
		if (dfs_visited[getIndex(dfs_v)]) dfs_line++;
		else dfs_line += 3;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 7) {
		dfs_line = 4;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 9) {
		dfs_visited[getIndex(dfs_v)] = 1;
		dfs_line++;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 10) {
		document.getElementById('dfs-terminal').innerHTML += `${dfs_v}\n`;
		dfs_line++;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 11) {
		if (dfs_w_index === nodes.length) dfs_w_index = nodes.length-1;
		else dfs_w_index--;
		if (dfs_w_index < 0) {
			dfs_w_index = nodes.length;
			dfs_line = 4;
		} else {
			dfs_line++;
		}
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 12) {
		if (containsEdge(dfs_v, nodes[dfs_w_index]) && !dfs_visited[dfs_w_index]) dfs_line++;
		else dfs_line--;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 13) {
		dfs_s.push(nodes[dfs_w_index]);
		document.getElementById('dfs-q').innerHTML += `${nodes[dfs_w_index]}\n`;
		node_elements[dfs_w_index].style.boxShadow = '0px 0px 15px 5px rgba(0, 0, 255, .75)';
		dfs_line = 11;
		dfs_lines[dfs_line].style.backgroundColor = "yellow";
	} else if (dfs_line === 18) {
		document.getElementById('dfs-next').disabled = true;
		document.getElementById('dfs-start').disabled = false;
	}
}

function resetDFS(event) {
	document.getElementById('dfs-source').disabled = false;
	document.getElementById('dfs-start').disabled = false;
	document.getElementById('dfs-next').disabled = true;
	document.getElementById('dfs-reset').disabled = true;
	dfs_running = false;
	dfs_lines[dfs_line].style.backgroundColor = "whitesmoke";
	for (let i = 0; i < nodes.length; i++) {
		node_elements[i].style.boxShadow = 'none';
	}
	document.getElementById('dfs-terminal').innerHTML = '';
	document.getElementById('dfs-q').innerHTML = '';
}


/*****************************
******************************

Dijkstra STUFF

******************************
*****************************/

let dijkstra_line = 0;
let dijkstra_vset = new Set();
let dijkstra_source = 0;
let dijkstra_v = -1;
let dijkstra_dist;
let dijkstra_pred;
let dijkstra_w_index = -1;
let dijkstra_running = false;

function showDijkstra(event) {
	if (dfs_running) resetDFS();
	if (bfs_running) resetBFS();
	let dfs_button = document.getElementById('dfs-button');
	let bfs_button = document.getElementById('bfs-button');
	let dfs = document.getElementById('dfs');
	let bfs = document.getElementById('bfs');
	let dijkstra = document.getElementById('dijkstra');
	dfs_button.style.backgroundColor = '#F0F0F0';
	bfs_button.style.backgroundColor = '#F0F0F0';
	dfs.style.display = 'none';
	bfs.style.display = 'none';
	this.style.backgroundColor = 'white';
	dijkstra.style.display = 'flex';
}

function startDijkstra(event) {
	const sourceText = document.getElementById('dijkstra-source').value;
	if (sourceText === undefined || sourceText === '') {
		alert("Source is not a valid node :(");
		return;
	}
	dijkstra_source = parseInt(sourceText);
	if (dijkstra_source < 0 || !nodes.includes(dijkstra_source)) {
		alert("Source is not a valid node :(");
		return;
	}
	document.getElementById('dijkstra-source').disabled = true;
	document.getElementById('dijkstra-start').disabled = true;
	document.getElementById('dijkstra-next').disabled = false;
	document.getElementById('dijkstra-reset').disabled = false;
	dijkstra_line = 5;
	dijkstra_lines[dijkstra_line].style.backgroundColor = "yellow";
	dijkstra_dist = [];
	dijkstra_pred = [];
	dijkstra_vset.clear();
	dijkstra_running = true;
	dijkstra_v = -1;
	dijkstra_w_index = -1;
	let dijkstra_table = document.getElementById('dijkstra-table');
	for (let i = 0; i < nodes.length; i++) {
		let th = document.createElement('th');
		let td1 = document.createElement('td');
		let td2 = document.createElement('td');
		th.innerHTML = nodes[i];
		dijkstra_table.rows[0].appendChild(th);
		dijkstra_table.rows[1].appendChild(td1);
		dijkstra_table.rows[2].appendChild(td2);
	}
}

function nextDijkstra(event) {
	dijkstra_lines[dijkstra_line].style.backgroundColor = "whitesmoke";
	if (dijkstra_line === 5) {
		let dijkstra_table = document.getElementById('dijkstra-table');
		for (let i = 0; i < nodes.length; i++) {
			dijkstra_table.rows[1].cells[i+1].innerHTML = '∞';
			dijkstra_dist[i] = Infinity;
		}
		dijkstra_line++;
		dijkstra_lines[dijkstra_line].style.backgroundColor = "yellow";
	} else if (dijkstra_line === 6) {
		dijkstra_dist[getIndex(dijkstra_source)] = 0;
		let dijkstra_table = document.getElementById('dijkstra-table');
		dijkstra_table.rows[1].cells[getIndex(dijkstra_source)+1].innerHTML = 0;
		dijkstra_line++;
		dijkstra_lines[dijkstra_line].style.backgroundColor = "yellow";
	} else if (dijkstra_line === 7) {
		let dijkstra_table = document.getElementById('dijkstra-table');
		for (let i = 0; i < nodes.length; i++) {
			dijkstra_table.rows[2].cells[i+1].innerHTML = '-1';
			dijkstra_pred[i] = -1;
		}
		dijkstra_line++;
		dijkstra_lines[dijkstra_line].style.backgroundColor = "yellow";
	} else if (dijkstra_line === 8) {
		let vset = document.getElementById('dijkstra-vset');
		for (let i = 0; i < nodes.length; i++) {
			dijkstra_vset.add(nodes[i]);
			vset.innerHTML += ` ${nodes[i]} `;
		}
		dijkstra_line++;
		dijkstra_lines[dijkstra_line].style.backgroundColor = "yellow";
	} else if (dijkstra_line === 9) {
		if (dijkstra_vset.size === 0) dijkstra_line = 15;
		else dijkstra_line++;
		dijkstra_lines[dijkstra_line].style.backgroundColor = "yellow";
	} else if (dijkstra_line === 10) {
		let minIndex = -1
		dijkstra_vset.forEach(v => {
			if (minIndex === -1 || dijkstra_dist[getIndex(v)] < dijkstra_dist[getIndex(minIndex)]) minIndex = v;
		});
		dijkstra_v = minIndex;
		node_elements[getIndex(dijkstra_v)].style.boxShadow = '0px 0px 15px 5px rgba(0, 255, 0, .75)';
		dijkstra_line++;
		dijkstra_lines[dijkstra_line].style.backgroundColor = "yellow";
	} else if (dijkstra_line === 11) {
		if (dijkstra_w_index === -1) {
			dijkstra_w_index = 0;
		} else {
			dijkstra_w_index++;
		}
		while (dijkstra_w_index < nodes.length && !containsEdge(dijkstra_v, nodes[dijkstra_w_index])) dijkstra_w_index++;
		if (dijkstra_w_index >= nodes.length) {
			dijkstra_w_index = -1;
			dijkstra_line = 14;
		} else {
			dijkstra_line++;
		}
		dijkstra_lines[dijkstra_line].style.backgroundColor = "yellow";
	} else if (dijkstra_line === 12) {
		let sum = dijkstra_dist[getIndex(dijkstra_v)] + getWeight(dijkstra_v, nodes[dijkstra_w_index]);
		if (sum < dijkstra_dist[dijkstra_w_index]) {
			dijkstra_dist[dijkstra_w_index] = sum;
			dijkstra_pred[dijkstra_w_index] = dijkstra_v;
			let dijkstra_table = document.getElementById('dijkstra-table');
			dijkstra_table.rows[1].cells[dijkstra_w_index+1].innerHTML = sum;
			dijkstra_table.rows[2].cells[dijkstra_w_index+1].innerHTML = dijkstra_v;
		}
		dijkstra_line--;
		dijkstra_lines[dijkstra_line].style.backgroundColor = "yellow";
	} else if (dijkstra_line === 14) {
		dijkstra_vset.delete(dijkstra_v);
		let vset = document.getElementById('dijkstra-vset');
		vset.innerHTML = vset.innerHTML.replace(` ${dijkstra_v} `, '');
		node_elements[getIndex(dijkstra_v)].style.boxShadow = '0px 0px 15px 5px rgba(255, 0, 0, .75)';
		dijkstra_line = 9;
		dijkstra_lines[dijkstra_line].style.backgroundColor = "yellow";
	} else if (dijkstra_line === 15) {
		document.getElementById('dijkstra-next').disabled = true;
		document.getElementById('dijkstra-start').disabled = false;
	}
}

function resetDijkstra(event) {
	document.getElementById('dijkstra-source').disabled = false;
	document.getElementById('dijkstra-start').disabled = false;
	document.getElementById('dijkstra-next').disabled = true;
	document.getElementById('dijkstra-reset').disabled = true;
	dijkstra_running = false;
	dijkstra_lines[dijkstra_line].style.backgroundColor = "whitesmoke";
	for (let i = 0; i < nodes.length; i++) {
		node_elements[i].style.boxShadow = 'none';
	}
	document.getElementById('dijkstra-vset').innerHTML = '';
	// TODO clear dist and pred
}


/*****************************
******************************

GRAPH STUFF

******************************
*****************************/

let m = [];
let l = [];

function initGraph(n) {
	m = [];
	l = [];
	for (let i = 0; i < n; i++) {
		m.push([-1, -1, -1, -1, -1]); // FIX ME
		l.push([]);
	}
}

function insertNode(num) {
	let index = getIndex(num);
	m.forEach(row => {row.splice(index, 0, NaN);});
	let tmp = [];
	for (let i = 0; i <= nodes.length; i++) tmp.push(NaN);
	m.splice(index, 0, tmp);
	l.splice(index, 0, []);
}

function removeNode(num, index) {
	m.splice(index, 1);
	m.forEach(row => {row.splice(index, 1);});
	l.splice(index, 1);
}

function insertEdge(from, to, directed, weight) {
	const fromIndex = getIndex(from);
	const toIndex = getIndex(to);
	console.log(from, to, directed, weight, fromIndex, toIndex);
	m[fromIndex][toIndex] = weight;
	l[fromIndex].push(to);
	if (!directed) {
		m[toIndex][fromIndex] = weight;
		l[toIndex].push(from);
	}
}

function containsEdge(from, to) {
	const fromIndex = getIndex(from);
	const toIndex = getIndex(to);
	// console.log(m[fromIndex][toIndex]);
	// console.log(m[fromIndex][toIndex] !== NaN);
	return !isNaN(m[fromIndex][toIndex]);
}

function getWeight(from, to) {
	const fromIndex = getIndex(from);
	const toIndex = getIndex(to);
	// console.log(m[fromIndex][toIndex]);
	// console.log(m[fromIndex][toIndex] !== NaN);
	if (!isNaN(m[fromIndex][toIndex])) return m[fromIndex][toIndex];
	return Infinity;
}