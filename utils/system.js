export function generateRandomId(length = 26) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
}

function generateRandomCpuInfo() {
    const cpuModels = [
        "AMD Ryzen 5 5600G with Radeon Graphics",
        "Intel Core i7-9700K",
        "AMD Ryzen 7 5800X",
        "Intel Core i9-10900K",
        "Intel Core i5-11600K",
        "AMD Ryzen 9 5900X",
        "Intel Core i7-12700K",
        "AMD Ryzen 5 3600X",
        "Intel Core i9-11900K",
        "AMD Ryzen 3 3200G",
        "Intel Core i9-13900K",
        "AMD Ryzen 9 7950X",
        "Intel Core i5-13600K",
        "AMD Ryzen 7 7700X",
        "Intel Core i7-13700K",
        "AMD Ryzen 5 7600X",
        "Intel Core i3-13100",
        "AMD Ryzen 7 5700G",
        "Intel Core i5-12400F",
        "AMD Ryzen 9 7900X",
        "AMD Ryzen 7 5800X3D",
        "Intel Core i9-12900KS",
        "AMD Ryzen 5 5500",
        "Intel Core i7-11700K",
        "AMD Ryzen 3 4100",
        "Intel Core i5-10600K",
        "AMD Threadripper 3990X",
        "Intel Core i9-10850K",
        "AMD Ryzen 7 3700X",
        "Intel Xeon W-3175X"
    ];

    const features = ["mmx", "sse", "sse2", "sse3", "ssse3", "sse4_1", "sse4_2", "avx"];
    const numOfProcessors = [4, 8, 16, 32][Math.floor(Math.random() * 4)];

    let processors = [];
    for (let i = 0; i < numOfProcessors; i++) {
        processors.push({
            usage: {
                idle: Math.floor(Math.random() * 2000000000000),
                kernel: Math.floor(Math.random() * 10000000000),
                total: Math.floor(Math.random() * 2000000000000),
                user: Math.floor(Math.random() * 50000000000)
            }
        });
    }

    return {
        archName: "x86_64",
        features: features,
        modelName: cpuModels[Math.floor(Math.random() * cpuModels.length)],
        numOfProcessors: numOfProcessors,
        processors: processors,
        temperatures: []
    };
}

function generateRandomGpuInfo() {
    const renderers = [
        "ANGLE (AMD, AMD Radeon(TM) Graphics (0x00001638) Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (NVIDIA, GeForce GTX 1080 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (Intel, Iris Xe Graphics (0x00008086) Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (NVIDIA, GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (AMD, Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (NVIDIA, GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (AMD, Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (Intel, Arc A770 Graphics (0x00008086) Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (NVIDIA, GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (AMD, Radeon RX 6600 XT Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (NVIDIA, GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (AMD, Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (Intel, Arc A750 Graphics (0x00008086) Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (NVIDIA, GeForce RTX 2080 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (AMD, Radeon RX 5700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (NVIDIA, GeForce GTX 1660 Super Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (AMD, Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (Intel, UHD Graphics 750 (0x00008086) Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (NVIDIA, GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)",
        "ANGLE (AMD, Radeon RX 7900 XT Direct3D11 vs_5_0 ps_5_0, D3D11)"
    ];
    const vendors = ["Google Inc. (AMD)", "NVIDIA", "Intel"]

    return {
        renderer: renderers[Math.floor(Math.random() * renderers.length)],
        vendor: vendors[Math.floor(Math.random() * vendors.length)]
    };
}

function generateRandomOperatingSystem() {
    const osList = ["windows", "linux", "macOS"];
    return osList[Math.floor(Math.random() * osList.length)];
}

export function generateRandomSystemData() {
    return {
        id: generateRandomId(26),
        type: "system",
        data: {
            gpuInfo: generateRandomGpuInfo(),
            memoryInfo: {
                availableCapacity: Math.floor(Math.random() * 1000000000) + 1000000000,
                capacity: Math.floor(Math.random() * 1000000000) + 2000000000
            },
            operatingSystem: generateRandomOperatingSystem(),
            machineId: generateRandomId(32).toLowerCase(),
            cpuInfo: generateRandomCpuInfo()
        }
    };
}
