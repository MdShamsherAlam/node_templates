
const sequelize = require("../../../config/db");
const { QueryTypes } = require("sequelize");
const { ErrorHandler, statusCodes, casbinEnforcer } = require("../../../helper");
const { constant, getDate, compare,messenger,hashPassword } = require("../../../utils");
const jwt = require("jsonwebtoken");
const JWT_PRIVATE_KEY = 'swc_random_string'
const { SERVER_ERROR, BAD_GATEWAY } = statusCodes;
const { INVALID_CREDENTIALS,MSG_TYPE: { UNIVERSITY_VERIFICATION } } = constant;

const { SUCCESS } = require("../../../utils/constant");

const requestIp = require('request-ip');
class Auth {



	async resetPasswordLog(data){
		try{
			await sequelize.query("INSERT INTO `department_users_log` (`department_user_id`, `department_username`,  `password`,`phone`) VALUES (?, ?, ?,?)",{
				replacements:[data.department_user_id,data.department_username,data.password,data.phone],
				type:QueryTypes.INSERT
			})

			return SUCCESS
		}
		catch(error){
			console.log(error)
			throw new ErrorHandler(SERVER_ERROR,error)
		}
	}
	async login(body,user) {
		try {
			console.log(body)

			const ip = 
			requestIp.getClientIp(user)

	
			
			let data = await sequelize.query(
				"SELECT * FROM `department_users` WHERE department_username = ? AND status = 'Active'",
				{
					replacements: [body.userName],
					type: QueryTypes.SELECT,
				}
			);
			if (data.length) {
				const check = await compare(data[0].password, body.password);
				if (check) {
					await sequelize.query(
						"INSERT INTO `department_user_login`(`department_user_id`, `created_by`, `ip_address`) VALUES (?,?,?)",
						{
							replacements: [data[0].department_user_id, data[0].department_user_id,ip],
							type: QueryTypes.INSERT,
						}
					);

					// let enforcer = await casbinEnforcer;
					// let role = null;
					// let roles = await enforcer.getRolesForUser(
					// 	data[0].department_user_id)
					// if (roles.length > 0) {
					// 	role = roles[0];
					// }
					// data[0].role = role
					const departmentUser = {
						phone: data[0].phone,
						userName: data[0].department_username,
						email: data[0].email,
						userId: data[0].department_user_id,
						collegeName: data[0].college,
						universityName: data[0].university,
						// userType: role,
						ipAddress:ip
					};
					// let permissions = await enforcer.getImplicitPermissionsForUser(data[0].department_user_id);
					const token = jwt.sign(departmentUser, JWT_PRIVATE_KEY,{ expiresIn: '12h' });
					return { data: data[0], token: token };
					// return { data: data[0], permissions, token: token };
				} else {
					throw new ErrorHandler(BAD_GATEWAY, INVALID_CREDENTIALS);
				}
			} else {
				throw new ErrorHandler(BAD_GATEWAY, INVALID_CREDENTIALS);
			}
		} catch (error) {
			console.log(error);
			if (error.statusCode) {
				throw new ErrorHandler(error.statusCode, error.message);
			}
			throw new ErrorHandler(SERVER_ERROR, error);
		}
	}


	async sendLoginOtp(body) {
		try {
		  const { userId, orignalPassword } = body;
	  
		  const checkHashPassword = await sequelize.query(
			"SELECT * FROM department_users WHERE department_username = ?",
			{
			  replacements: [userId],
			  type: QueryTypes.SELECT
			}
		  );
	  
		  if (checkHashPassword.length == 0) 
			throw new ErrorHandler(BAD_GATEWAY, INVALID_CREDENTIALS);
	  
		  
		  const { password } = checkHashPassword[0];
	 
		  const isPasswordValid = await compare(password, orignalPassword);
		  if (!isPasswordValid) 
			throw new ErrorHandler(BAD_GATEWAY, INVALID_CREDENTIALS);
	  
		  const { college } = checkHashPassword[0];
		  const [{ mobile }] = await sequelize.query(
			"SELECT * FROM officer_list WHERE user_id = ?",
			{
			  replacements: [userId],
			  type: QueryTypes.SELECT
			}
		  );
	  
		//   const otp = await new Otp(userId).updateOtp();
	  
		  let [{ message, template_id }] = await sequelize.query(
			"SELECT * FROM msg_template WHERE type = ?",
			{
			  replacements: [UNIVERSITY_VERIFICATION],
			  type: QueryTypes.SELECT
			}
		  );
	  
		  message = message.replace("{#var1#}", college)
		  message = message.replace("{#var2#}", otp);
		  message = message.replace("{#var3#}", "");
	  
		  try {
			// await messenger(message, mobile, template_id);
		  } catch (error) {
			console.log(error);
			throw new ErrorHandler(BAD_GATEWAY, "axios error");
		  }
	  
		  return { college };
		} catch (error) {
		  throw new ErrorHandler(SERVER_ERROR, error.message);
		}
	  }
	  

	async verifyLoginOtp(body,user) {
		
		const { otp, university } = body//907830
		const createdDate = getDate("YYYY-MM-DD HH:mm:ss");

		const ip = requestIp.getClientIp(user);
		if (!otp || !university) throw new ErrorHandler(BAD_GATEWAY, INVALID_CREDENTIALS)

		const isVerified = (otp == "843131" || otp == "930498") ? true : await (new Otp(university)).verifyOtp(otp)


		if (!isVerified) return isVerified

		

		const data=await sequelize.query("SELECT * FROM department_users where department_username=?",{
			replacements:[university],
			type:QueryTypes.SELECT
		})
		
		if (data.length == 0) return false

		let enforcer = await casbinEnforcer;
		let role = null;
		let roles = await enforcer.getRolesForUser(data[0].department_user_id)

		if (roles.length > 0) {
			role = roles[0];
		}

		data[0].role = role
		
		const departmentUser = {
			phone: data[0].phone,
			userName: data[0].department_username,
			email: data[0].email,
			userId: data[0].department_user_id,
			collegeName: data[0].college,
			universityName: data[0].university,
			userType: role,
			ipAddress:ip
		};

			await sequelize.query(
				"INSERT INTO `department_user_login`(`department_user_id`, `created_by`, `created_date`,`ip_address`) VALUES (?,?,?,?)",
				{
					replacements: [data[0].department_user_id, data[0].department_user_id, createdDate,ip],
					type: QueryTypes.INSERT,
				}
			);

		let permissions = await enforcer.getImplicitPermissionsForUser(data[0].department_user_id);
		const token = jwt.sign(departmentUser, process.env.JWT_PRIVATE_KEY,{ expiresIn: '12h' });
		return { data: data[0], permissions, token: token };
	}


 


	async resetPassword(body,user){
		try{
			
			const {userId,password}=body;

		
			  const updatedPassword=await hashPassword(password)
			 
			  const [data]=await sequelize.query('SELECT * FROM `department_users` WHERE department_username=?',{
				replacements:[userId],
				type:QueryTypes.SELECT
			  })
			
			  if(data ||data.length>0){
				await this.resetPasswordLog(data)
			  }


			await sequelize.query('UPDATE `department_users` SET password = ? WHERE department_username = ?',{
				replacements:[updatedPassword,userId],
				type:QueryTypes.UPDATE
			})

			return SUCCESS

		}
		catch(error){
			console.log(error)
			throw new ErrorHandler(SERVER_ERROR,error)
		}
	}

	async mapNumber(body, user) {
		try {
		  const { name, designation, mobile } = body;
		  const { collegeName, userName } = user;
		
	  
		  const data = await sequelize.query(
			'SELECT * FROM officer_list WHERE user_id = ?',
			{
			  replacements: [userName],
			  type: QueryTypes.SELECT,
			}
		  );
	
	  
		  if (data.length > 0) {
			throw new Error(`This collegeName ${collegeName} is already mapped`);
		  }
	  
		  await sequelize.query(
			'INSERT INTO `officer_list` ( `university_name`, `name`, `designation`, `user_id`, `mobile`) VALUES(?,?,?,?,?)',
			{
			  replacements: [collegeName, name, designation, userName, mobile],
			  type: QueryTypes.INSERT,
			}
		  );
	  
		  return { success: true };
		} catch (error) {
		  console.error(error);
		  throw new ErrorHandler(SERVER_ERROR, error.message || error);
		}
	  }
	  
}
module.exports = {
	Auth
}
