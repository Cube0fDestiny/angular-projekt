import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

import * as db from "../db/index.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const attachUserFromHeaders = async (req, res, next) => {
    const userDataHeader = req.headers["x-user-data"];
  
    if (!userDataHeader) {
      return next();
    }
  
    try {
      const userData = JSON.parse(userDataHeader);
      req.user = userData;
      next();
    } catch (error) {
      console.log(error + " Nieprawidłowy lub wygasły token");
      return res.status(401).json({ message: "Nieprawidłowy lub wygasły token" });
    }
  };

export const isQualified = (...allowedRoles) =>
{
 return   async (req, res ,next) =>
    {
        const authenticatedUserId = req.user.id;
        const groupId = req.params.id;
        try
        {
            const result = await db.query(`
                SELECT member_type FROM "Group_Memberships" 
                WHERE user_id  = $1 AND group_id=$2
        
            `,[authenticatedUserId,groupId]);
        
            if (result.rows.length === 0)
            {
                return res.status(404).json({ message: "Grupa nie istnieje lub użytkownik nie jest w grupie" });
            }
            const member_type = result.rows[0].member_type;
            for (let i = 0; i < allowedRoles.length; i++)
            {
                if (allowedRoles[i] === member_type) {
                  next();
                  break; 
                } 
                if(i+1=== allowedRoles.length)
                {
                    //this is here rather than after the for loop because it would've popped up when it shouldn't 
                    return res.status(403).json({ message: "Nie masz permisji do tego działania." });
                } 
            }
        }
        catch (err)
        {
            res.status(500).json({ error: "Błąd serwera podczas sprawdzania uprawnień." });
        }
    }
}

export const isSuperior= async (req,res,next)=>
{
    

    const log = req.log;
    const groupId = req.params.id;
    const actionUserId= req.user.id;
    const affectedUserId = req.body.target_user;
    try
    {
        const actionUserData=await db.query(`SELECT * FROM "Group_Memberships" WHERE group_id=$1 AND user_id=$2`,[groupId,actionUserId])
        if(actionUserData.rowCount===0)
        {
            log.info(
                "Użytkownik "+actionUserId+ " chciał oddziaływać na grupę "+ groupId+" której nie jest członkiem" 
            );
            return res.status(403).json({ message: "Nie jesteś członkiem tej grupy." });
            
        }

        const affectedUserData = await db.query(`SELECT * FROM "Group_Memberships" WHERE group_id=$1 AND user_id=$2`,[groupId,affectedUserId])
        if(affectedUserData.rowCount===0)
        {
            log.info(
                "Próba oddziaływania na użytkownika "+affectedUserId+ " w grupie "+ groupId+" której nie jest członkiem" 
            );
            return res.status(403).json({ message: "Cel nie jest członkiem tej grupy" });
            
        }
         switch(affectedUserData.rows[0].member_type)
        {
            case'normal_member':
             
                if(actionUserData.rows[0].member_type==='owner' || actionUserData.rows[0].member_type==='admin' || actionUserData.rows[0].member_type==='moderator' )
                {
                    next()
                }
                else
                {
                    log.info(
                        "Próba oddziaływania na użytkownika "+affectedUserId+ " w grupie "+ groupId+" przez członka niższego lub równego rzędu,"+actionUserData 
                    );
                    return res.status(403).json({ message: "Brak kwalifikacji do akcji" });
                }
                 break;

            case'moderator':
                if(actionUserData.rows[0].member_type==='owner' || actionUserData.rows[0].member_type==='admin' )
                {
                    next()
                }
                else
                {
                    log.info(
                
                        "Próba oddziaływania na użytkownika "+affectedUserId+ " w grupie "+ groupId+" przez członka niższego lub równego rzędu,"+actionUserData 
                    );
                    return res.status(403).json({ message: "Brak kwalifikacji do akcji" });
                }
                break;
            
            case'admin':
                if(actionUserData.rows[0].member_type==='owner')
                {
                    next()
                }
                else
                {
                    log.info(
                
                        "Próba oddziaływania na użytkownika "+affectedUserId+ " w grupie "+ groupId+" przez członka niższego lub równego rzędu,"+actionUserData 
                    );
                    return res.status(403).json({ message: "Brak kwalifikacji do akcji" });
                }
                 break;

            case'banned':
                if(actionUserData.rows[0].member_type==='owner' || actionUserData.rows[0].member_type==='admin')
                {
                    next()
                }
                else
                {
                    log.info(
                
                        "Próba oddziaływania na użytkownika "+affectedUserId+ " w grupie "+ groupId+" przez członka niższego lub równego rzędu,"+actionUserData 
                    );
                    return res.status(403).json({ message: "Brak kwalifikacji do akcji" });
                }
                break;

            case'owner':
                if(actionUserData.rows[0].member_type==='owner')
                {
                    log.info( 
                        "Próba oddziaływania na użytkownika "+affectedUserId+ " w grupie "+ groupId+" przez członka niższego lub równego rzędu,"+actionUserData 
                    );
                    return res.status(403).json({ message: "Brak kwalifikacji do akcji" }); 
                }
                else
                {
                    log.info(
                    
                        "Próba oddziaływania na użytkownika "+affectedUserId+ " w grupie "+ groupId+" przez członka niższego lub równego rzędu,"+actionUserData 
                    );
                    return res.status(403).json({ message: "Brak kwalifikacji do akcji" });
                }
                break;
        }
    }
    catch (err) {
        res.status(500).json({err, error: "Błąd serwera podczas sprawdzania uprawnień." });
    }
}




export const requireAuth = async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Brak autoryzacji" });
    }
    next();
  };
 