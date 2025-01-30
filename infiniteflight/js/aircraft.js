const aircraftMachDetails = {
        "81d9ccd4-9c03-493a-811e-8fad3e57bd05": { name: "A-10", minMach: 0.40, maxMach: 0.56 },
        "876b428a-3ee2-46cd-9d8c-2c59424dfcb5": { name: "AC-130", minMach: 0.40, maxMach: 0.60 },
        "710c84ae-6fdc-4c4a-ac3b-4031c3036e98": { name: "A220-300", minMach: 0.72, maxMach: 0.82 },
        "982dd974-5be7-4369-90c6-bd92863632ba": { name: "A318", minMach: 0.70, maxMach: 0.82 },
        "2c2f162e-a7d9-4ebd-baf4-859aed36165a": { name: "A319", minMach: 0.70, maxMach: 0.82 },
        "a266b67f-03e3-4f8c-a2bb-b57cfd4b12f3": { name: "A320", minMach: 0.70, maxMach: 0.82 },
        "d7434d84-555a-4d9b-93a7-53c77cf846ea": { name: "A321", minMach: 0.70, maxMach: 0.82 },
        "6af2c9f8-abd8-4872-a9bc-4e79fd84fe77": { name: "A330-300", minMach: 0.78, maxMach: 0.86 },
        "474810ee-503c-44f2-a305-c176ec8cc431": { name: "A330-900", minMach: 0.78, maxMach: 0.86 },
        "230ec095-5e36-4637-ba2f-68831b31e891": { name: "A350-900", minMach: 0.78, maxMach: 0.89 },
        "f11ed126-bce8-46ef-9265-69191c354575": { name: "A380-800", minMach: 0.78, maxMach: 0.89 },
        "2ec6f8cd-fdb9-464f-87c2-808f778fdb1d": { name: "B737-700", minMach: 0.72, maxMach: 0.82 },
        "4f6fc40d-a5b5-43c5-b5ff-ff0000a878b2": { name: "B737-8 MAX", minMach: 0.72, maxMach: 0.82 },
        "f60a537d-5f83-4b68-8f66-b5f76d1e1775": { name: "B737-800", minMach: 0.72, maxMach: 0.82 },
        "64568366-b72c-47bd-8bf6-6fdb81b683f9": { name: "B737-900", minMach: 0.72, maxMach: 0.82 },
        "c82da702-ea61-4399-921c-34f35f3ca5c4": { name: "B747-200", minMach: 0.78, maxMach: 0.85 },
        "de510d3d-04f8-46e0-8d65-55b888f33129": { name: "B747-400", minMach: 0.78, maxMach: 0.92 },
        "9759c19f-8f18-40f5-80d1-03a272f98a3b": { name: "B747-8", minMach: 0.78, maxMach: 0.90 },
        "0d49ce9e-446a-4d12-b651-6983afdeeb40": { name: "B747-SCA", minMach: 0.55, maxMach: 0.60 },
        "3ee45d20-1984-4d95-a753-3696e35cdf77": { name: "B747-SOFIA", minMach: 0.75, maxMach: 0.85 },
        "ed29f26b-774e-471e-a23a-ecb9b6f5da74": { name: "B757-200", minMach: 0.70, maxMach: 0.86 },
        "bec63a00-a483-4427-a076-0f76dba0ee97": { name: "B777-200ER", minMach: 0.78, maxMach: 0.89 },
        "8290107b-d728-4fc3-b36e-0224c1780bac": { name: "B777-200LR", minMach: 0.78, maxMach: 0.89 },
        "e258f6d4-4503-4dde-b25c-1fb9067061e2": { name: "B777-300ER", minMach: 0.78, maxMach: 0.89 },
        "6925c030-a868-49cc-adc8-7025537c51ca": { name: "B777F", minMach: 0.78, maxMach: 0.89 },
        "c1ae3647-f56a-4dc4-9007-cc8b1a2697a5": { name: "B787-8", minMach: 0.78, maxMach: 0.90 },
        "61084cae-8aac-4da4-a7df-396ec6d9c870": { name: "B787-10", minMach: 0.78, maxMach: 0.90 },
        "3098345e-1152-4441-96ec-40a71179a24f": { name: "Dash-8 Q400", minMach: 0.45, maxMach: 0.66 },
        "ef677903-f8d3-414f-a190-233b2b855d46": { name: "C172", minMach: 0.15, maxMach: 0.20 },
        "206884f9-38a8-4118-a920-a7dcbd166c47": { name: "C208", minMach: 0.25, maxMach: 0.31 },
        "8bafde46-7e6e-44c5-800f-917237c49d75": { name: "XCub", minMach: 0.20, maxMach: 0.27 },
        "3f17ca35-b384-4391-aa5e-5beececb0612": { name: "TBM-930", minMach: 0.45, maxMach: 0.53 },
        "af055734-aaed-44ad-a2d0-5b9046f29d0d": { name: "E175", minMach: 0.70, maxMach: 0.82 },
        "7de22dcf-91dd-4932-b225-533298873df2": { name: "E190", minMach: 0.70, maxMach: 0.82 },
        "24364e52-3788-487f-9f98-00f38b1f459c": { name: "CRJ-200", minMach: 0.70, maxMach: 0.81 },
        "8f34680a-a4ad-4f21-91e9-3a932ab03ca4": { name: "CRJ-700", minMach: 0.70, maxMach: 0.82 },
        "b3907f6b-c8cf-427b-94fb-1f9365d990df": { name: "CRJ-1000", minMach: 0.70, maxMach: 0.82 },
        "e59fa7b4-b708-4480-aebd-26659a4f312b": { name: "DC-10", minMach: 0.78, maxMach: 0.88 },
        "e92bc6db-a9e6-4137-a93c-a7423715b799": { name: "SR22", minMach: 0.40, maxMach: 0.60 }
};

async function pairAircraftData(aircraftIds) {
    const pairedData = {};

    aircraftIds.forEach((id) => {
        const machDetails = aircraftMachDetails[id] || { minMach: "N/A", maxMach: "N/A" };
        pairedData[id] = {
            minMach: machDetails.minMach,
            maxMach: machDetails.maxMach,
        };
    });

    return pairedData;
}


export { pairedAircraftData };
export default aircraftMachDetails;