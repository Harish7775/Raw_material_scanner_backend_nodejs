 

module.exports = {
    enum: {
        role: {
            Admin: 'Admin',
            Retailer: 'Retailer',
            Mason: 'Mason',
        }, 
    },
    auth: {
        not_authorize: 'Not authorized to access this resource',
        login_error: 'Mobile/Email or Password does not match.',
        login_status: 'User status is {status}',
        login_verification_status: 'User verification status is {status}, Please contact to Administrator',
        register_success: 'You have been registered successfully',
        noaccount_error: 'No account with that user exists.',
    },
    user: {
        noaccount_error: 'No account with that user exists.',
        update_profile_image_error: 'Image update failed',
        update_profile_image_success: 'Image update succssfully',
        change_password_error: 'Invalid Old Password',
        change_password_success: 'Your password has been successfully changed',
      
        logout: 'User logout successfully',
        login: 'User login successfully',
    },
    admin: {
        logout: 'Admin logout successfully'
    },
    curd: {
        generate: 'Records generated successfully',
        add: 'Record inserted successfully',
        update: 'Record updated successfully',
        delete: 'Record deleted successfully',
        invalid_image_dimensions: 'Invalid image dimensions',
        no_record: 'No record found',
        image_required: 'Image Required',
        
    },
  
   
    status_code: {
        header: {
            ok: 200,
            unauthorized: 200,
            server_error: 200
        },
        body: {
            ok: 200,
            unauthorized: 401,
            server_error: 500
        }
    },
    tableName:{
        users:'Users',
    }
}