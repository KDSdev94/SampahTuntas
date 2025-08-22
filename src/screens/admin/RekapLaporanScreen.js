import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase'
import { getFont } from '../../Utils/fontFallback';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import moment from 'moment';
import 'moment/locale/id';

moment.locale('id');

const generateYearList = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 4 }, (_, index) => {
    const year = currentYear - index;
    return { label: year.toString(), value: year };
  });
};

export default function RekapLaporanScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const dataYear = generateYearList();

  const getStatusText = (status) => {
    if (status === 'pending') return 'Pending';
    if (status === 'approved') return 'Disetujui';
    return 'Selesai';
  };

  const getStatusColor = (status) => {
    if (status === 'pending') return '#ffc107';
    if (status === 'approved') return '#28a745';
    return '#17a2b8';
  };

  const getPriorityColor = (priority) => {
    const priorityLower = priority?.toLowerCase();
    if (priorityLower === 'tinggi') return '#dc3545';
    if (priorityLower === 'sedang') return '#ffc107';
    return '#28a745';
  };

  const getPriorityText = (priority) => {
    const priorityLower = priority?.toLowerCase();
    if (priorityLower === 'tinggi') return 'Tinggi';
    if (priorityLower === 'sedang') return 'Sedang';
    return 'Rendah';
  };

  const fetchReports = async (year) => {
    setLoading(true);
    console.log('Fetching reports for year:', year);
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      console.log('Date range:', startDate, 'to', endDate);
      
      // Try without date filter first to see if there's any data
      const q = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc')
      );
      
      const documentSnapshots = await getDocs(q);
      console.log('Total documents found:', documentSnapshots.docs.length);
      
      if (documentSnapshots.docs.length === 0) {
        console.log('No reports found in database');
        setReports([]);
        return;
      }
      
      // Filter by year in JavaScript instead of Firestore query
      const filteredDocs = documentSnapshots.docs.filter(doc => {
        const data = doc.data();
        if (data.createdAt) {
          const docDate = data.createdAt.toDate();
          const docYear = docDate.getFullYear();
          return docYear === year;
        }
        return false;
      });
      
      console.log('Documents after year filter:', filteredDocs.length);
      
      const newReports = await Promise.all(filteredDocs.map(async (reportDoc) => {
        const reportData = reportDoc.data();
        console.log('Processing report:', reportDoc.id, reportData);
        let userName = 'Anonim';
        let userAddress = 'Alamat tidak diketahui';

        try {
          if (reportData.uid) {
            const userDocRef = doc(db, 'users', reportData.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              userName = userData.nama || 'Nama tidak diketahui';
              userAddress = userData.alamat || 'Alamat tidak diketahui';
            }
          }
        } catch (error) {
          console.log('Error fetching user:', error.message);
        }

        return { id: reportDoc.id, ...reportData, userName, userAddress };
      }));
      
      console.log('Final reports array:', newReports.length, newReports);
      setReports(newReports);
    } catch (error) {
      console.error("Error fetching reports: ", error);
      Alert.alert("Error", "Gagal memuat laporan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedYear);
  }, [selectedYear]);

  const generateHTML = () => {
    let rows = reports.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.userName}</td>
        <td>${item.userAddress}</td>
        <td><span class="priority" style="background-color: ${getPriorityColor(item.priority)}">${getPriorityText(item.priority)}</span></td>
        <td><span class="status" style="background-color: ${getStatusColor(item.status)}">${getStatusText(item.status)}</span></td>
        <td>${moment(item.createdAt.toDate()).format('D MMM YYYY')}</td>
        <td>${item.updatedAt ? moment(item.updatedAt.toDate()).format('D MMM YYYY') : '-'}</td>
      </tr>
    `).join('');

    return `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            .priority, .status { color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Rekap Laporan - Tahun ${selectedYear}</h1>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Pelapor</th>
                <th>Alamat</th>
                <th>Prioritas</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Penanganan</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    if (reports.length === 0) {
      Alert.alert('Tidak ada data', 'Tidak ada data untuk dicetak.');
      return;
    }
    const html = generateHTML();
    try {
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert('Gagal Mencetak', 'Terjadi kesalahan saat mencoba mencetak dokumen.');
    }
  };

  const handleExportPDF = async () => {
    if (reports.length === 0) {
      Alert.alert('Tidak ada data', 'Tidak ada data untuk diekspor ke PDF.');
      return;
    }
    const html = generateHTML();
    try {
      const { uri } = await Print.printToFileAsync({ html });
      const pdfName = `${FileSystem.documentDirectory}RekapLaporan_${selectedYear}.pdf`;
      await FileSystem.moveAsync({
        from: uri,
        to: pdfName,
      });
      await Sharing.shareAsync(pdfName);
    } catch (error) {
      Alert.alert('Gagal Ekspor PDF', 'Terjadi kesalahan saat mencoba mengekspor ke PDF.');
    }
  };
  
  // Pagination functions
  const totalPages = Math.ceil(reports.length / rowsPerPage);
  const startIndex = currentPage * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, reports.length);
  const currentPageData = reports.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderTableRow = (item, index) => (
    <View key={item.id} style={styles.tableRow}>
      <View style={[styles.tableCell, styles.cellNo]}>
        <Text style={styles.cellText}>{startIndex + index + 1}</Text>
      </View>
      <View style={[styles.tableCell, styles.cellPelapor]}>
        <Text style={styles.cellText}>{item.userName}</Text>
      </View>
      <View style={[styles.tableCell, styles.cellPrioritas]}>
        <View style={[styles.priorityContainer, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{getPriorityText(item.priority)}</Text>
        </View>
      </View>
      <View style={[styles.tableCell, styles.cellStatus]}>
        <View style={[styles.statusContainer, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <View style={[styles.tableCell, styles.cellTanggal]}>
        <Text style={styles.cellText}>{moment(item.createdAt.toDate()).format('D MMM YYYY')}</Text>
      </View>
      <View style={[styles.tableCell, styles.cellPenanganan]}>
        <Text style={styles.cellText}>{item.updatedAt ? moment(item.updatedAt.toDate()).format('D MMM YYYY') : '-'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rekap Laporan</Text>
      </View>

      <View style={styles.filterContainer}>
        <Picker
          selectedValue={selectedYear}
          onValueChange={(itemValue) => setSelectedYear(itemValue)}
          style={styles.picker}
        >
          {dataYear.map(item => <Picker.Item key={item.value} label={item.label} value={item.value} />)}
        </Picker>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" style={{ marginTop: 20 }}/>
      ) : (
        <View style={styles.tableContainer}>
          {reports.length > 0 ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScrollView}>
                <View style={styles.table}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <View style={[styles.tableHeaderCell, styles.cellNo]}>
                      <Text style={styles.tableHeaderText}>No</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.cellPelapor]}>
                      <Text style={styles.tableHeaderText}>Pelapor</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.cellPrioritas]}>
                      <Text style={styles.tableHeaderText}>Prioritas</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.cellStatus]}>
                      <Text style={styles.tableHeaderText}>Status</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.cellTanggal]}>
                      <Text style={styles.tableHeaderText}>Tanggal</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, styles.cellPenanganan]}>
                      <Text style={styles.tableHeaderText}>Penanganan</Text>
                    </View>
                  </View>
                  
                  {/* Table Body */}
                  <View style={styles.tableBody}>
                    {currentPageData.map((item, index) => renderTableRow(item, index))}
                  </View>
                </View>
              </ScrollView>
              
              {/* Pagination Controls */}
              <View style={styles.paginationContainer}>
                <View style={styles.paginationInfo}>
                  <Text style={styles.paginationText}>
                    {startIndex + 1}-{endIndex} of {reports.length}
                  </Text>
                </View>
                <View style={styles.paginationControls}>
                  <TouchableOpacity 
                    style={[styles.paginationButton, currentPage === 0 && styles.paginationButtonDisabled]} 
                    onPress={goToPreviousPage}
                    disabled={currentPage === 0}
                  >
                    <Ionicons name="chevron-back" size={20} color={currentPage === 0 ? '#ccc' : '#4CAF50'} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.paginationButton, currentPage >= totalPages - 1 && styles.paginationButtonDisabled]} 
                    onPress={goToNextPage}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <Ionicons name="chevron-forward" size={20} color={currentPage >= totalPages - 1 ? '#ccc' : '#4CAF50'} />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tidak ada laporan pada tahun {selectedYear}.</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={handlePrint}>
        <Ionicons name="print-outline" size={24} color="white" />
      </TouchableOpacity>
       <TouchableOpacity style={[styles.fab, { bottom: 90, backgroundColor: '#4CAF50' }]} onPress={handleExportPDF}>
        <Ionicons name="document-text-outline" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 15,
    },
    backButton: {
        marginRight: 20,
    },
    headerTitle: {
        fontSize: 20,
        ...getFont('bold'),
        color: '#fff',
    },
    filterContainer: {
        padding: 10,
        backgroundColor: '#fff',
        margin: 10,
        borderRadius: 10,
        elevation: 2,
    },
    picker: {
        height: 50,
        backgroundColor: '#f9f9f9',
        borderRadius: 5,
    },
    tableContainer: {
        flex: 1,
        margin: 8,
    },
    horizontalScrollView: {
        maxHeight: 350, // Batasi tinggi untuk 5 baris + header + sedikit padding
    },
    table: {
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        minWidth: 600, // Minimum width for horizontal scroll
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        borderBottomWidth: 1,
        borderBottomColor: '#388E3C',
    },
    tableHeaderCell: {
        paddingVertical: 15,
        paddingHorizontal: 12,
        borderRightWidth: 1,
        borderRightColor: '#388E3C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tableHeaderText: {
        color: '#fff',
        ...getFont('bold'),
        fontSize: 13,
        textAlign: 'center',
    },
    tableBody: {
        backgroundColor: '#fff',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        minHeight: 56,
    },
    tableCell: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRightWidth: 1,
        borderRightColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cellText: {
        fontSize: 12,
        color: '#424242',
        textAlign: 'center',
    },
    // Column widths
    cellNo: {
        width: 60,
    },
    cellPelapor: {
        width: 120,
    },
    cellPrioritas: {
        width: 100,
    },
    cellStatus: {
        width: 100,
    },
    cellTanggal: {
        width: 110,
    },
    cellPenanganan: {
        width: 110,
    },
    priorityContainer: {
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    priorityText: {
        color: '#fff',
        fontSize: 11,
        ...getFont('bold'),
        textTransform: 'uppercase',
    },
    statusContainer: {
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
        minWidth: 70,
        alignItems: 'center',
    },
    statusText: {
        color: '#fff',
        fontSize: 11,
        ...getFont('bold'),
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        marginTop: 8,
        borderRadius: 8,
        elevation: 1,
    },
    paginationInfo: {
        flex: 1,
    },
    paginationText: {
        fontSize: 14,
        color: '#757575',
        ...getFont('500'),
    },
    paginationControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    paginationButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
        backgroundColor: '#f5f5f5',
    },
    paginationButtonDisabled: {
        backgroundColor: '#e0e0e0',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 1,
    },
    emptyText: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        right: 20,
        bottom: 20,
        backgroundColor: '#2196F3',
        borderRadius: 28,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
});
