import React from 'react'
import { getFont } from '../../../Utils/fontFallback';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const CurvedHeader = ({ title, subtitle, height = 200 }) => {
  return (
    <View style={[styles.headerContainer, { height }]}>
      {/* Background Image */}
      <Image 
        source={require('../../../../assets/images/top_header.png')} 
        style={styles.headerBackground}
        resizeMode="cover"
      />
      
      {/* Overlay for better text visibility */}
      <View style={styles.headerOverlay} />
      
      {/* Content */}
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        )}
      </View>
      
      {/* Curved bottom using SVG effect with View */}
      <View style={styles.curveContainer}>
        <View style={styles.curve} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.7)', // Green overlay
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40, // Account for status bar
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    ...getFont('bold'),
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  curveContainer: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 50,
  },
  curve: {
    width: width,
    height: 50,
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: width / 2,
    borderTopRightRadius: width / 2,
    transform: [{ scaleX: 2 }],
  },
});

export default CurvedHeader;
