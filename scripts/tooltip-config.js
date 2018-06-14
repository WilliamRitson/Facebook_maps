import d3 from "https://dev.jspm.io/d3";
import { Tooltip } from "./tooltip.js";

const format = d3.format(",");

function makeTip(name, requests, accounts, provided, approval) {
    return `
        <table>
        <caption>Data Requests </caption>
        <tr>
            <th align='left'>Country</th>
            <td align='center'>:</td>
            <td align='right'>${name}</td>
        </tr>
        <tr>
            <th align='left'>Number of Requests</th>
            <td align='center'>:</td>
            <td align='right'>${requests}</td>
        </tr>
        <tr>
            <th align='left'>Number of Accounts</th>
            <td align='center'>:</td>
            <td align='right'>${accounts}</td>
        </tr>
        <tr>
            <th align='left'>Times Data was Provided</th>
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

function datapointToHtml(d) {
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
}

export const tip = new Tooltip(datapointToHtml);
