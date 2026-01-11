import { Image } from 'expo-image';
import React, { useEffect, useState, useRef } from 'react';
import { 
  Platform, 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
  StatusBar
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.8;
const CARD_MARGIN = 12;

// TypeScript interfaces
interface Property {
  _id: string;
  title: string;
  price: number;
  location: string;
  type: 'room' | 'apartment' | 'hotel' | 'house';
  images: string[];
  rating?: number;
  isFeatured?: boolean;
  amenities?: string[];
}

interface PropertyCardProps {
  property: Property;
  onPress: (property: Property) => void;
}

// Custom Gradient Component using pure JavaScript
const CustomGradient: React.FC<{
  colors: string[];
  style?: any;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}> = ({ colors, style, start = { x: 0.5, y: 0 }, end = { x: 0.5, y: 1 } }) => {
  return (
    <View 
      style={[
        style,
        {
          backgroundColor: colors[0], // Fallback to first color
          // In a real implementation, you'd use multiple layered views with opacity
          // or consider react-native-linear-gradient if properly installed
        }
      ]}
    />
  );
};

// Gradient overlay using multiple layers for depth
const GradientOverlay: React.FC<{ style?: any }> = ({ style }) => {
  return (
    <View style={[style, styles.gradientOverlay]}>
      <View style={styles.gradientLayer1} />
      <View style={styles.gradientLayer2} />
      <View style={styles.gradientLayer3} />
    </View>
  );
};

// Mock data for properties
const mockProperties: Property[] = [
  {
    _id: '1',
    title: 'Luxury Studio Apartment',
    price: 1200,
    location: 'Downtown Manhattan',
    type: 'apartment',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
    ],
    rating: 4.8,
    isFeatured: true,
    amenities: ['wifi', 'parking', 'ac']
  },
  {
    _id: '2',
    title: 'Cozy Student Room Near Campus',
    price: 650,
    location: 'University District',
    type: 'room',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800'
    ],
    rating: 4.3,
    isFeatured: true,
    amenities: ['wifi', 'laundry', 'furnished']
  },
  {
    _id: '3',
    title: 'Boutique Hotel Suite',
    price: 200,
    location: 'Business District',
    type: 'hotel',
    images: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'
    ],
    rating: 4.6,
    isFeatured: true,
    amenities: ['wifi', 'breakfast', 'gym', 'pool']
  },
  {
    _id: '4',
    title: 'Modern Family House',
    price: 1800,
    location: 'Green Valley Suburbs',
    type: 'house',
    images: [
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'
    ],
    rating: 4.9,
    isFeatured: true,
    amenities: ['parking', 'garden', 'pet-friendly']
  }
];

const categories = [
  { icon: '🏠', name: 'Apartments', count: '1,234' },
  { icon: '🛏️', name: 'Rooms', count: '856' },
  { icon: '🏨', name: 'Hotels', count: '432' },
  { icon: '🏡', name: 'Houses', count: '678' },
  { icon: '🌟', name: 'Luxury', count: '189' },
];

export default function HomeScreen() {
  const [message, setMessage] = useState('');
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFeaturedProperties(mockProperties);
      setLoading(false);
    }, 1500);

    fetch("http://192.168.1.177:5000/")
      .then(res => res.text())
      .then(setMessage)
      .catch(console.error);
  }, []);

  const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress }) => {
    return (
      <TouchableOpacity 
        style={styles.propertyCard}
        onPress={() => onPress(property)}
        activeOpacity={0.9}
      >
        <View style={styles.card}>
          {/* Property Image with Custom Gradient Overlay */}
          <Image
            source={{ uri: property.images[0] }}
            style={styles.propertyImage}
            contentFit="cover"
            transition={300}
          />
          
          {/* Custom gradient overlay using multiple layers */}
          <GradientOverlay style={styles.imageGradient} />
          
          {/* Favorite Button */}
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Price Tag */}
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>${property.price}</Text>
            <Text style={styles.priceSubText}>/month</Text>
          </View>

          {/* Property Info */}
          <View style={styles.propertyInfo}>
            <View style={styles.propertyHeader}>
              <View style={styles.titleContainer}>
                <Text style={styles.propertyTitle} numberOfLines={1}>
                  {property.title}
                </Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.rating}>{property.rating}</Text>
                </View>
              </View>
              
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color="#fff" />
                <Text style={styles.propertyLocation} numberOfLines={1}>
                  {property.location}
                </Text>
              </View>
            </View>

            {/* Property Type Badge */}
            <View style={styles.propertyType}>
              <Text style={styles.typeText}>
                {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const CategoryCard = ({ icon, name, count }: { icon: string; name: string; count: string }) => (
    <TouchableOpacity style={styles.categoryCard}>
      <View style={styles.categoryIcon}>
        <Text style={styles.categoryEmoji}>{icon}</Text>
      </View>
      <Text style={styles.categoryName}>{name}</Text>
      <Text style={styles.categoryCount}>{count} properties</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <View style={styles.loadingAnimation}>
          <Image
            source="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"
            style={styles.loadingImage}
            contentFit="cover"
          />
          <Text style={styles.loadingText}>Finding your perfect stay...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header with Solid Color Background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hello, 👋</Text>
            <Text style={styles.headerTitle}>Find Your Perfect Stay</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Image
              source="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
              style={styles.profileImage}
              contentFit="cover"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <TouchableOpacity style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <Text style={styles.searchText}>Search for locations, properties...</Text>
        </TouchableOpacity>

        {/* Categories Grid */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category, index) => (
              <CategoryCard
                key={index}
                icon={category.icon}
                name={category.name}
                count={category.count}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Properties */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Properties</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.carouselContainer}>
            <ScrollView 
              horizontal 
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
            >
              {featuredProperties.map((property, index) => (
                <PropertyCard
                  key={property._id}
                  property={property}
                  onPress={(prop) => console.log('Selected:', prop)}
                />
              ))}
            </ScrollView>
            
            {/* Carousel Indicators */}
            <View style={styles.indicators}>
              {featuredProperties.map((_, index) => {
                const inputRange = [
                  (index - 1) * CARD_WIDTH,
                  index * CARD_WIDTH,
                  (index + 1) * CARD_WIDTH,
                ];
                
                const dotWidth = scrollX.interpolate({
                  inputRange,
                  outputRange: [8, 20, 8],
                  extrapolate: 'clamp',
                });
                
                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp',
                });
                
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        width: dotWidth,
                        opacity,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* Special Offers with Solid Color Design */}
        <View style={styles.offersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
          </View>
          
          <View style={styles.offerCard}>
            <View style={styles.offerContent}>
              <View>
                <Text style={styles.offerTitle}>Student Discount</Text>
                <Text style={styles.offerSubtitle}>Get 20% off on your first booking</Text>
                <TouchableOpacity style={styles.offerButton}>
                  <Text style={styles.offerButtonText}>Claim Offer</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.offerBadge}>
                <Text style={styles.offerBadgeText}>20% OFF</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Server Status */}
        {message && (
          <View style={styles.serverStatus}>
            <Ionicons name="server" size={16} color="#10b981" />
            <Text style={styles.serverText}>Server: Connected</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingAnimation: {
    alignItems: 'center',
  },
  loadingImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#667eea', // Solid color instead of gradient
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -25,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  searchText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#64748b',
  },
  categoriesSection: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  seeAllText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 14,
  },
  categoriesContainer: {
    paddingHorizontal: 15,
  },
  categoryCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 6,
    width: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 4,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 11,
    color: '#64748b',
  },
  featuredSection: {
    marginTop: 30,
  },
  carouselContainer: {
    position: 'relative',
  },
  horizontalScroll: {
    paddingHorizontal: CARD_MARGIN,
  },
  propertyCard: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
  },
  card: {
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '33%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  gradientLayer2: {
    position: 'absolute',
    top: '33%',
    left: 0,
    right: 0,
    height: '33%',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  gradientLayer3: {
    position: 'absolute',
    top: '66%',
    left: 0,
    right: 0,
    height: '34%',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceTag: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  priceSubText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 2,
  },
  propertyInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  propertyHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rating: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyLocation: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginLeft: 4,
  },
  propertyType: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginHorizontal: 4,
  },
  offersSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  offerCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#667eea', // Solid color background
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  offerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  offerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },
  offerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  offerButtonText: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: 14,
  },
  offerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  offerBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f0fdf4',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  serverText: {
    marginLeft: 8,
    color: '#166534',
    fontWeight: '500',
  },
});