'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      profilePicture: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create Drivers table
    await queryInterface.createTable('drivers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      availability_status: {
        type: Sequelize.ENUM('online', 'offline'),
        allowNull: false,
        defaultValue: 'offline'
      },
      vehicleType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      vehicleCapacity: {
        type: Sequelize.STRING,
        allowNull: false
      },
      vehicleNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create Admins table
    await queryInterface.createTable('admins', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      profilePicture: {
        type: Sequelize.STRING(255),
        allowNull: true,
        defaultValue: null
      },
      permissions: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create Vehicle Types table
    await queryInterface.createTable('vehicle_types', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      vehicleType: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false
      },
      capacity: {
        type: Sequelize.STRING,
        allowNull: false
      },
      basePrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      pricePerKm: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      startingPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      iconKey: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'default'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create Vehicles table
    await queryInterface.createTable('vehicles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      vehicleNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      model: {
        type: Sequelize.STRING,
        allowNull: false
      },
      licensePlate: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      capacity: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      maxWeight: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      currentLat: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      currentLng: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'available'
      },
      driverId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'drivers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      lastMaintenanceDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create Shipments table
    await queryInterface.createTable('shipments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      trackingNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
      },
      pickupAddress: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      deliveryAddress: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      pickupLat: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      pickupLng: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      deliveryLat: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      deliveryLng: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      scheduledPickupDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      estimatedDeliveryDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      actualPickupDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      actualDeliveryDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      weight: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      distance: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      dimensions: {
        type: Sequelize.STRING,
        allowNull: true
      },
      specialInstructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      userType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'authenticated'
      },
      guestName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      guestPhone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      guestEmail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      vehicleType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      vehicleId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'vehicles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      paymentStatus: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create Addresses table
    await queryInterface.createTable('addresses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false
      },
      addressLine1: {
        type: Sequelize.STRING,
        allowNull: false
      },
      addressLine2: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false
      },
      zip: {
        type: Sequelize.STRING,
        allowNull: false
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create User Preferences table
    await queryInterface.createTable('user_preferences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      emailNotifications: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      smsNotifications: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      pushNotifications: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      marketingEmails: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      darkTheme: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      language: {
        type: Sequelize.STRING,
        defaultValue: 'EN'
      },
      defaultVehicleType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      defaultPaymentMethod: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create OTP Verifications table
    await queryInterface.createTable('otp_verifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      otp: {
        type: Sequelize.STRING(6),
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create Driver Documents table
    await queryInterface.createTable('driver_documents', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      driver_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'drivers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      driving_license_path: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      passport_photo_path: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      vehicle_rc_path: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      insurance_paper_path: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'verified', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['phone']);
    await queryInterface.addIndex('drivers', ['phone']);
    await queryInterface.addIndex('drivers', ['vehicleNumber']);
    await queryInterface.addIndex('admins', ['email']);
    await queryInterface.addIndex('admins', ['phone']);
    await queryInterface.addIndex('shipments', ['trackingNumber']);
    await queryInterface.addIndex('shipments', ['userId']);
    await queryInterface.addIndex('shipments', ['status']);
    await queryInterface.addIndex('shipments', ['userType']);
    await queryInterface.addIndex('vehicles', ['licensePlate']);
    await queryInterface.addIndex('vehicles', ['driverId']);
    await queryInterface.addIndex('vehicle_types', ['vehicleType']);
    await queryInterface.addIndex('vehicle_types', ['isActive']);
    await queryInterface.addIndex('addresses', ['userId']);
    await queryInterface.addIndex('user_preferences', ['userId']);
    await queryInterface.addIndex('otp_verifications', ['phone']);
    await queryInterface.addIndex('driver_documents', ['driver_id']);
    await queryInterface.addIndex('driver_documents', ['status']);
  },

  async down (queryInterface) {
    // Drop tables in reverse order to handle foreign key dependencies
    await queryInterface.dropTable('driver_documents');
    await queryInterface.dropTable('otp_verifications');
    await queryInterface.dropTable('user_preferences');
    await queryInterface.dropTable('addresses');
    await queryInterface.dropTable('shipments');
    await queryInterface.dropTable('vehicles');
    await queryInterface.dropTable('vehicle_types');
    await queryInterface.dropTable('admins');
    await queryInterface.dropTable('drivers');
    await queryInterface.dropTable('users');
  }
};
