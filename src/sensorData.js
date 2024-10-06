import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const SensorData = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:8000/sensorData');
                console.log('API Response:', response.data);
                setData(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5000); 

        return () => clearInterval(intervalId); 
    }, []);

    const sortData = (key) => {
        let direction = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        const sortedData = [...data].sort((a, b) => {
            if (a[key] < b[key]) {
                return direction === 'ascending' ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        setData(sortedData);
        setSortConfig({ key, direction });
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'SensorData');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, 'sensor_data.xlsx');
    };

    const graphData = {
        labels: data.map((_, index) => index + 1),
        datasets: [
            {
                label: 'Temperature (°C)',
                data: data.map((item) => item.temperature),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
            {
                label: 'Pressure (hPa)',
                data: data.map((item) => item.pressure),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
            {
                label: 'Humidity (%)',
                data: data.map((item) => item.humidity),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <div>
            <h1>SCADA HMI</h1>
            <h2>Life Sciences process</h2>
            <button
    onClick={exportToExcel}
    style={{
        marginBottom: '20px',
        padding: '10px 20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.3s ease',
    }}
    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#45a049')}
    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4CAF50')}
>
    Export to Excel
</button>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div>
                    <table>
                        <thead>
                            <tr>
                                <th onClick={() => sortData('temperature')}>Temperature (°C)</th>
                                <th onClick={() => sortData('pressure')}>Pressure (hPa)</th>
                                <th onClick={() => sortData('humidity')}>Humidity (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.slice(-5).map((item, index) => (
                                <tr key={index}>
                                    <td>{item.temperature.toFixed(2)}</td>
                                    <td>{item.pressure !== undefined ? item.pressure.toFixed(2) : 'N/A'}</td>
                                    <td>{item.humidity.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div>
                        <h2>Temperature Chart</h2>
                        <Line data={graphData} />
                    </div>
                    <div>
                        <h2>Pressure Chart</h2>
                        {data.length > 0 && data.some(item => item.pressure !== undefined) ? (
                            <Line data={graphData} />
                        ) : (
                            <p>No data available for Pressure.</p>
                        )}
                    </div>
                    <div>
                        <h2>Humidity Chart</h2>
                        <Line data={graphData} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SensorData;
