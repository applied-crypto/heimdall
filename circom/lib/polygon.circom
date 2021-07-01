include "./circomlib/circuits/comparators.circom";

template Polygon(n) {
	signal input verty[n];
	signal input vertx[n];
	signal private input testx;
	signal private input testy;
	signal output out;

	var c = 0;	
	var i;
	var j = n-1;
	signal tmp[5][n];
	signal bool[3][n];
	component gt[4][n];
	component st[n];

	for (i=0;i<n;i++) {
		gt[0][i] = GreaterThan(64);
		gt[0][i].in[0] <== verty[i];
		gt[0][i].in[1] <== testy;
		gt[1][i] = GreaterThan(64);
		gt[1][i].in[0] <== verty[j];
		gt[1][i].in[1] <== testy;
		tmp[0][i] <== (1 - gt[0][i].out) * gt[1][i].out; 
		tmp[1][i] <== gt[0][i].out * (1 - gt[1][i].out);
		bool[0][i] <== tmp[0][i] + tmp[1][i];
		tmp[2][i] <== verty[j] - verty[i];
		gt[2][i] = GreaterThan(64);
		gt[2][i].in[0] <== tmp[2][i];
		gt[2][i].in[1] <== 0;
		tmp[3][i] <== (testx - vertx[i]) * tmp[2][i];
		tmp[4][i] <== (vertx[j] - vertx[i]) * (testy - verty[i]);
		gt[3][i] = GreaterThan(64);
		gt[3][i].in[0] <== tmp[3][i];
		gt[3][i].in[1] <== tmp[4][i];
		st[i] = LessThan(64);
		st[i].in[0] <== tmp[3][i];
		st[i].in[1] <== tmp[4][i];
		bool[1][i] <== gt[2][i].out * gt[3][i].out;
		bool[2][i] <== (1 - gt[2][i].out) * st[i].out;
		c += bool[0][i] * (bool[1][i] + bool[2][i]);
		j = i;
    }
	out <-- c & 1;
	out * (out - 1) === 0;
}