var format = d3.format(",");

function makeTip(name, requests, accounts, provided, approval) {
    return `
        <table>
        <caption>Data Requests</caption>
        <tr>
            <th align='left'>Country</th>
            <td align='center'>:</td>
            <td align='right'>${name}</td>
        </tr>
        <tr>
            <th align='left'># Requests</th>
            <td align='center'>:</td>
            <td align='right'>${requests}</td>
        </tr>
        <tr>
            <th align='left'># Accounts</th>
            <td align='center'>:</td>
            <td align='right'>${accounts}</td>
        </tr>
        <tr>
            <th align='left'>Data Provided</th>
            <td align='center'>:</td>
            <td align='right'>${provided}</td>
        </tr>
        <tr>
            <th align='left'>Approval Rate</th>
            <td align='center'>:</td>
            <td align='right'>${approval}</td>
        </tr>
        </table>
    `;
}

// Set tooltips
export const tip = d3
    .tip()
    .attr("class", "d3-tip")
    .offset([100, 0])
    .html(function(d) {
        if (isNaN(d.requests) || d.requests == 0) {
            return makeTip(
                d.properties.name,
                "No Requests Made",
                "0",
                "Not Applicable",
                "Not Applicable"
            );
        } else {
            return makeTip(
                d.properties.name,
                format(d.requests),
                format(d.accounts),
                format(Math.round((d.requests * d.rate) / 100)),
                Math.round(d.rate) + "%"
            );
        }
    });
